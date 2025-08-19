// 📁 src/pages/movie/MovieHome.jsx
// 🎬 Trang chủ movie với tích hợp API backend

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Play, Grid, List, Filter, ArrowLeft, RefreshCw } from 'lucide-react';
import { useMovieStore, useUIStore, useAuthStore } from '@/store';
import Button from '@/components/common/Button';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import MovieCard from '@/components/movie/MovieCard';
import Pagination from '@/components/common/Pagination';
import MovieRandomSection from '@/components/movie/MovieRandomSection';
import { PAGINATION } from '@/constants';

const MovieHome = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sourceKey } = useAuthStore();
  const { loading: globalLoading } = useUIStore();
  
  const { 
    movieList, 
    currentPath, 
    loading, 
    error,
    searchTerm,
    setSearchTerm,
    fetchMovieFolders,
    clearMovieCache 
  } = useMovieStore();
  
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [moviesPerPage, setMoviesPerPage] = useState(() => {
    const urlVal = parseInt(searchParams.get('size') || '', 10);
    if (!Number.isNaN(urlVal) && urlVal > 0) return urlVal;
    try {
      const stored = parseInt(localStorage.getItem('movie.perPage') || '', 10);
      if (!Number.isNaN(stored) && stored > 0) return stored;
    } catch (_) {}
    return PAGINATION.MOVIES_PER_PAGE;
  });

  // Ensure selector options always include configured default (MOVIES_PER_PAGE)
  const moviePerPageOptions = React.useMemo(() => {
    const base = [1, 12, 24, 30, 48, 60, 96];
    const withDefault = [PAGINATION.MOVIES_PER_PAGE, ...base];
    return Array.from(new Set(withDefault)).sort((a, b) => a - b);
  }, []);

  // Redirect to home only when there's no sourceKey; don't bounce when switching sections
  useEffect(() => {
    if (!sourceKey) {
      navigate('/');
      return;
    }
  }, [sourceKey, navigate]);

  // Clear cache and refetch when sourceKey changes
  useEffect(() => {
    if (sourceKey && sourceKey.startsWith('V_')) {
      console.log('🎬 MovieHome: SourceKey changed to:', sourceKey, '- Clearing cache');
      clearMovieCache();
      // Do not fetch here to avoid overlap with URL effect
    }
  }, [sourceKey, clearMovieCache]);

  // Track last fetched key to avoid duplicate fetches
  const lastFetchRef = React.useRef('');

  // Load initial path from URL (only when URL changes)
  useEffect(() => {
    const pathFromUrl = searchParams.get('path') || '';
    const fetchKey = `${sourceKey || ''}|${pathFromUrl}`;
    console.log('🎬 MovieHome: URL path changed to:', pathFromUrl);

    if (!sourceKey || !sourceKey.startsWith('V_')) return;

    // Avoid duplicate fetch for same key (handles StrictMode double run)
    if (lastFetchRef.current === fetchKey && movieList.length > 0) {
      console.log('🎬 MovieHome: Skipping fetch, same fetchKey and list already loaded');
      return;
    }

    lastFetchRef.current = fetchKey;
    fetchMovieFolders(pathFromUrl);
  }, [searchParams, fetchMovieFolders, sourceKey]);

  // Persist per-page whenever it changes (including via URL)
  useEffect(() => {
    try { localStorage.setItem('movie.perPage', String(moviesPerPage)); } catch (_) {}
  }, [moviesPerPage]);

  // NOTE: Pagination now applies AFTER filtering & sorting (was previously on raw movieList)
  // We'll compute filtered + sorted lists first, then slice for current page.
  // (Declarations of filteredMovies/sortedMovies appear later; we lift pagination calculation below after they exist.)
  // Temporary placeholders; real values assigned after sortedMovies defined.
  let totalPages = 0;
  let currentMovies = [];

  // Reset page when path changes
  useEffect(() => {
    setCurrentPage(0);
  }, [currentPath, movieList]);

  // Handle back navigation
  const handleBackClick = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.join('/');
    navigate(`/movie${newPath ? `?path=${encodeURIComponent(newPath)}` : ''}`);
  };

  // Generate breadcrumb items
  const breadcrumbItems = () => {
    if (!currentPath) return [{ name: 'Movies', path: '' }];
    
    const pathParts = currentPath.split('/').filter(Boolean);
    const items = [{ name: 'Movies', path: '' }];
    
    let currentBreadcrumbPath = '';
    pathParts.forEach((part, index) => {
      currentBreadcrumbPath += (currentBreadcrumbPath ? '/' : '') + part;
      items.push({
        name: part,
        path: currentBreadcrumbPath
      });
    });
    
    return items;
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchMovieFolders(currentPath);
  };

  // Helper to normalize text for more robust search (case & basic accents insensitive)
  const normalize = (str = '') => str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  const needle = normalize(searchTerm);

  // Filter and sort movies (apply search to name & path)
  const filteredMovies = movieList.filter(movie => {
    if (!needle) return true;
    const name = normalize(movie.name || '');
    const path = normalize(movie.path || '');
    return name.includes(needle) || path.includes(needle);
  });

  const sortedMovies = [...filteredMovies].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'type':
        return (a.type || '').localeCompare(b.type || '');
      case 'views':
        return (b.views || 0) - (a.views || 0);
      default:
        return 0;
    }
  });

  // Now compute pagination based on sortedMovies
  totalPages = Math.ceil(sortedMovies.length / moviesPerPage) || 1;
  currentMovies = sortedMovies.slice(
    currentPage * moviesPerPage,
    (currentPage + 1) * moviesPerPage
  );

  // Reset page when search term changes or filtered size shrinks below current window
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, sortBy]);
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0);
    }
  }, [totalPages]);

  // Handle navigation
  const handleGoBack = () => {
    if (currentPath) {
      const pathParts = currentPath.split('/').filter(Boolean);
      const parentPath = pathParts.slice(0, -1).join('/');
      fetchMovieFolders(parentPath);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePerPageChange = (val) => {
    const n = Math.max(1, parseInt(val, 10) || PAGINATION.MOVIES_PER_PAGE);
    setMoviesPerPage(n);
    setCurrentPage(0);
  };

  if (loading || globalLoading) {
    return <LoadingOverlay message="Loading movies..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Random Sections - First */}
      <div className="bg-gray-50 dark:bg-gray-900 py-6">
        <div className="w-full px-6">
          <MovieRandomSection />
        </div>
      </div>

      {/* Header + Grid Section Combined */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {currentPath && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackClick}
                icon={ArrowLeft}
              >
                Back
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🎬 Movies
              </h1>
              {/* Breadcrumb */}
              <nav className="flex mt-2" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  {breadcrumbItems().map((item, index) => (
                    <li key={index} className="inline-flex items-center">
                      {index > 0 && (
                        <svg className="w-6 h-6 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {index === breadcrumbItems().length - 1 ? (
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                          {item.name}
                        </span>
                      ) : (
                        <button
                          onClick={() => navigate(`/movie${item.path ? `?path=${encodeURIComponent(item.path)}` : ''}`)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          {item.name}
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>
          <div className="flex items-center gap-3">
              {/* Per-page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Per page</span>
                <select
                  value={moviesPerPage}
                  onChange={(e) => handlePerPageChange(e.target.value)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                >
                  {moviePerPageOptions.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              icon={RefreshCw}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={Filter}
            >
              Filters
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              icon={Grid}
            />
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              icon={List}
            />
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="name">Name</option>
                  <option value="type">Type</option>
                  <option value="views">Views</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Movies Grid/List - Now inside the white container */}
        {sortedMovies.length === 0 ? (
          <div className="text-center py-12">
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No movies found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search' : 'This folder is empty'}
            </p>
          </div>
        ) : (
          <>
            {/* Current page items (after filtering & sorting) */}
            <div className={`grid ${
              viewMode === 'grid'
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'grid-cols-1'
            } gap-6 mb-8 overflow-x-hidden`}>
              {currentMovies.map((movie) => (
                <MovieCard
                  key={movie.path}
                  item={movie}
                  showViews={false}
                />
              ))}
            </div>

            {/* Pagination (shared component) */}
            {totalPages > 1 && (
              <div className="mt-4 flex flex-col items-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={filteredMovies.length}
                  itemsPerPage={moviesPerPage}
                  enableJump={true}
                  center
                />
                <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage + 1} of {totalPages} • {filteredMovies.length} result{filteredMovies.length === 1 ? '' : 's'}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MovieHome;
