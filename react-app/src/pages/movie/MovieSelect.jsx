// 📁 src/pages/movie/MovieSelect.jsx
// 🎬 Trang chọn source movie

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Shield, Globe, Lock, Server, Film } from 'lucide-react';
import { useMovieStore, useAuthStore, useUIStore } from '@/store';
import Button from '@/components/common/Button';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import LoginModal from '@/components/auth/LoginModal';

const MovieSelect = () => {
  const navigate = useNavigate();
  const { movieSources, setCurrentSource } = useMovieStore();
  const { isAuthenticated, currentUser } = useAuthStore();
  const { isLoading, toggleLoading } = useUIStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);

  // Sample movie sources
  const sampleMovieSources = [
    {
      id: 'V_MOVIE',
      name: 'V_MOVIE',
      type: 'local',
      icon: Film,
      description: 'Local movie collection',
      isSecure: false,
      totalMovies: 245,
      status: 'active'
    },
    {
      id: 'V_ANIME',
      name: 'V_ANIME', 
      type: 'local',
      icon: Play,
      description: 'Anime collection',
      isSecure: false,
      totalMovies: 150,
      status: 'active'
    },
    {
      id: 'V_ANIMEH',
      name: 'V_ANIMEH',
      type: 'secure',
      icon: Shield,
      description: 'Secure anime collection',
      isSecure: true,
      totalMovies: 89,
      status: 'active'
    },
    {
      id: 'V_JAVA',
      name: 'V_JAVA',
      type: 'local',
      icon: Server,
      description: 'Java video collection',
      isSecure: false,
      totalMovies: 67,
      status: 'active'
    }
  ];

  useEffect(() => {
    // Simulate loading sources
    toggleLoading();
    setTimeout(() => {
      toggleLoading();
    }, 800);
  }, []);

  const handleSourceSelect = (source) => {
    if (source.isSecure && !isAuthenticated) {
      setSelectedSource(source);
      setShowLoginModal(true);
      return;
    }

    setCurrentSource(source);
    navigate('/movie');
  };

  const handleLoginSuccess = () => {
    if (selectedSource) {
      setCurrentSource(selectedSource);
      navigate('/movie');
    }
    setShowLoginModal(false);
    setSelectedSource(null);
  };

  if (isLoading) {
    return <LoadingOverlay message="Loading movie sources..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Film className="w-12 h-12 text-blue-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              🎬 Movie Sources
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose your movie source to start watching
          </p>
        </div>

        {/* Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sampleMovieSources.map((source) => {
            const IconComponent = source.icon;
            return (
              <div
                key={source.id}
                onClick={() => handleSourceSelect(source)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl
                         transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-700
                         hover:border-blue-500 dark:hover:border-blue-400"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${
                        source.isSecure 
                          ? 'bg-red-100 dark:bg-red-900/30' 
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <IconComponent className={`w-6 h-6 ${
                          source.isSecure ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                        }`} />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {source.name}
                        </h3>
                        {source.isSecure && (
                          <div className="flex items-center mt-1">
                            <Lock className="w-4 h-4 text-red-500 mr-1" />
                            <span className="text-sm text-red-600 dark:text-red-400">
                              Secure
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      source.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {source.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Play className="w-4 h-4 mr-1" />
                      {source.totalMovies} movies
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Globe className="w-4 h-4 mr-1" />
                      {source.type}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant={source.isSecure ? 'secondary' : 'primary'}
                    className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    icon={source.isSecure ? Lock : Play}
                  >
                    {source.isSecure ? 'Access Secure Source' : 'Enter Source'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center mb-3">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Public Sources
              </h3>
            </div>
            <p className="text-blue-800 dark:text-blue-200">
              Access general movie collections without authentication. Perfect for browsing and discovering content.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center mb-3">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400 mr-2" />
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                Secure Sources
              </h3>
            </div>
            <p className="text-red-800 dark:text-red-200">
              Protected collections requiring authentication. Contains premium or restricted content.
            </p>
          </div>
        </div>

        {/* Current User Info */}
        {isAuthenticated && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 
                          text-green-800 dark:text-green-200 rounded-full">
              <Shield className="w-4 h-4 mr-2" />
              Logged in as: {currentUser?.username}
            </div>
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setSelectedSource(null);
        }}
        onSuccess={handleLoginSuccess}
        sourceName={selectedSource?.name}
      />
    </div>
  );
};

export default MovieSelect;
