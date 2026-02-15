// 📁 src/pages/movie/MovieHome.jsx
// 🎬 Trang chủ movie với tích hợp API backend

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Play, Grid, List, Filter, ArrowLeft } from 'lucide-react';
import { FiArrowLeft, FiHome, FiGrid, FiList } from 'react-icons/fi';
import { useMovieStore, useUIStore, useAuthStore } from '@/store';
import Button from '@/components/common/Button';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import MovieCard from '@/components/movie/MovieCard';
import Pagination from '@/components/common/Pagination';
import Breadcrumb from '@/components/common/Breadcrumb';
import MovieRandomSection from '@/components/movie/MovieRandomSection';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
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
    clearMovieCache,
    deleteItem 
  } = useMovieStore();
  
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleGoBack = () => {
    if (!currentPath) {
      // If at root, navigate to home page
      navigate('/');
      return;
    }
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop(); // Remove last part
    const parentPath = pathParts.join('/');
    
    // Update URL and navigate
    setSearchParams(parentPath ? { path: parentPath } : {});
  };

  // Generate breadcrumb items
  const breadcrumbItems = () => {
    const items = [
      { label: '🎬 Movies', path: '' }
    ];
    
    if (currentPath) {
      const pathParts = currentPath.split('/').filter(Boolean);
      let accumPath = '';
      
      pathParts.forEach((part, index) => {
        accumPath += (accumPath ? '/' : '') + part;
        items.push({
          label: part,
          path: accumPath,
          isLast: index === pathParts.length - 1
        });
      });
    }
    
    return items;
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
      <div className="p-3 sm:p-6 pb-0">
        <MovieRandomSection />
      </div>

      {/* Main Content Container */}
      <div className="p-3 sm:p-6">
        <div className="movie-main-container bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
        {/* Header Controls */}
        {/* First row: Navigation and breadcrumb */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back button - responsive text */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                icon={currentPath ? FiArrowLeft : FiHome}
                className="flex-shrink-0"
              >
                <span className="hidden sm:inline">
                  {currentPath ? 'Back' : 'Home'}
                </span>
              </Button>

              {/* Breadcrumb */}
              <div className="min-w-0 flex-1">
                <Breadcrumb
                  items={breadcrumbItems()}
                  onNavigate={(path) => {
                    // Only update URL; fetching is handled by URL effect to avoid duplicate API calls
                    setSearchParams(path ? { path } : {});
                  }}
                />
              </div>
            </div>
          </div>

          {/* Controls - responsive layout */}
          <div className="flex items-center gap-2 sm:gap-3 lg:justify-end justify-start">
            {/* Per-page selector */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">Per page:</span>
              <select
                value={moviesPerPage}
                onChange={(e) => handlePerPageChange(e.target.value)}
                className="px-1.5 py-1 sm:px-2 sm:py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white"
              >
                {moviePerPageOptions.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            
            {/* Filter button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={Filter}
              className="flex-shrink-0"
            >
              <span className="hidden sm:inline ml-2">Filter</span>
            </Button>
            
            {/* View mode toggle */}
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5 sm:p-1">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                icon={FiGrid}
                className="rounded-md"
                title="Grid view"
              />
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                icon={FiList}
                className="rounded-md"
                title="List view"
              />
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-4 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Statistics cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-blue-500 mr-1.5 sm:mr-2" />
              <div>
                <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">{movieList.length}</p>
                <p className="text-[9px] sm:text-xs text-gray-600 dark:text-gray-400">Total Items</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-green-500 mr-1.5 sm:mr-2" />
              <div>
                <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  {movieList.filter(item => item.type === 'folder').length}
                </p>
                <p className="text-[9px] sm:text-xs text-gray-600 dark:text-gray-400">Folders</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-purple-500 mr-1.5 sm:mr-2" />
              <div>
                <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  {movieList.filter(item => item.type === 'video' || item.type === 'file').length}
                </p>
                <p className="text-[9px] sm:text-xs text-gray-600 dark:text-gray-400">Video Files</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-orange-500 mr-1.5 sm:mr-2" />
              <div>
                <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">{filteredMovies.length}</p>
                <p className="text-[9px] sm:text-xs text-gray-600 dark:text-gray-400">Search Results</p>
              </div>
            </div>
          </div>
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
        ) : viewMode === 'grid' ? (
          <>
            {/* Current page items (after filtering & sorting) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2 sm:gap-3 mb-4 sm:mb-6">
              {currentMovies.map((movie) => (
                <MovieCard
                  key={movie.path}
                  item={movie}
                  showViews={false}
                  variant="grid"
                  onDeleteClick={(item) => setItemToDelete(item)}
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
        ) : (
          <>
            {/* List view */}
            <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-4 sm:mb-6">
              {currentMovies.map((movie) => (
                <MovieCard
                  key={movie.path}
                  item={movie}
                  showViews={false}
                  variant="list"
                  onDeleteClick={(item) => setItemToDelete(item)}
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
        </div> {/* End of movie-main-container */}
      </div>

      {/* Delete Confirmation Modal - Single instance */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (!itemToDelete) return;
          setIsDeleting(true);
          try {
            await deleteItem(itemToDelete.path);
            setItemToDelete(null);
          } catch (err) {
            console.error('Delete failed:', err);
          } finally {
            setIsDeleting(false);
          }
        }}
        itemName={itemToDelete?.name || itemToDelete?.path?.split('/').pop() || ''}
        itemType={itemToDelete?.type === 'folder' ? 'folder' : 'file'}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default MovieHome;
