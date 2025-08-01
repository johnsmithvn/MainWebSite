// 📁 src/pages/music/MusicPlayer.jsx
// 🎵 Music player với playlist và controls

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Shuffle, Heart, Share, MoreHorizontal, Home,
  ChevronLeft, List, Clock, Music
} from 'lucide-react';
import { useMusicStore, useUIStore } from '@/store';
import Button from '@/components/common/Button';

const MusicPlayer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get('id');

  const { currentTrack, playlist, playerSettings, updatePlayerSettings } = useMusicStore();
  const { darkMode } = useUIStore();

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // off, one, all
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Sample track data
  const sampleTrack = {
    id: trackId || '1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: 355, // seconds
    year: 1975,
    genre: 'Rock',
    thumbnail: '/default/music-thumb.png',
    audioUrl: '/sample-audio.mp3', // Would be actual audio URL
    lyrics: `Is this the real life?\nIs this just fantasy?\nCaught in a landslide\nNo escape from reality...`
  };

  // Sample playlist
  const samplePlaylist = [
    sampleTrack,
    {
      id: '2',
      title: 'Hotel California',
      artist: 'Eagles',
      album: 'Hotel California',
      duration: 390,
      year: 1976,
      genre: 'Rock',
      thumbnail: '/default/music-thumb.png'
    },
    {
      id: '3',
      title: 'Billie Jean',
      artist: 'Michael Jackson',
      album: 'Thriller',
      duration: 294,
      year: 1982,
      genre: 'Pop',
      thumbnail: '/default/music-thumb.png'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(
    samplePlaylist.findIndex(track => track.id === trackId) || 0
  );

  useEffect(() => {
    // Simulate audio loading
    setDuration(sampleTrack.duration);
  }, [trackId]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // In real implementation, would control audio element
  };

  const nextTrack = () => {
    let nextIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * samplePlaylist.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= samplePlaylist.length) {
        nextIndex = repeatMode === 'all' ? 0 : currentIndex;
      }
    }
    setCurrentIndex(nextIndex);
  };

  const previousTrack = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : samplePlaylist.length - 1;
    setCurrentIndex(prevIndex);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  const toggleRepeat = () => {
    const modes = ['off', 'one', 'all'];
    const currentModeIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentModeIndex + 1) % modes.length]);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentTrackData = samplePlaylist[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 
                   dark:from-gray-900 dark:via-gray-800 dark:to-black text-white">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          icon={ChevronLeft}
          className="text-white hover:bg-white hover:bg-opacity-20"
        >
          Back
        </Button>
        
        <h1 className="text-lg font-semibold">Now Playing</h1>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPlaylist(!showPlaylist)}
          icon={List}
          className="text-white hover:bg-white hover:bg-opacity-20"
        />
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Album Art & Track Info */}
        <div className="text-center mb-8">
          <div className="w-80 h-80 mx-auto mb-6 rounded-lg overflow-hidden shadow-2xl">
            <img
              src={currentTrackData.thumbnail}
              alt={currentTrackData.album}
              className="w-full h-full object-cover"
            />
          </div>
          
          <h2 className="text-3xl font-bold mb-2">{currentTrackData.title}</h2>
          <p className="text-xl text-gray-300 mb-1">{currentTrackData.artist}</p>
          <p className="text-lg text-gray-400">{currentTrackData.album} • {currentTrackData.year}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div 
            className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-2"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-white rounded-full relative"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 
                            w-4 h-4 bg-white rounded-full shadow-lg" />
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleShuffle}
            icon={Shuffle}
            className={`text-white hover:bg-white hover:bg-opacity-20 ${
              isShuffled ? 'text-green-400' : ''
            }`}
          />
          
          <Button
            variant="ghost"
            size="lg"
            onClick={previousTrack}
            icon={SkipBack}
            className="text-white hover:bg-white hover:bg-opacity-20"
          />
          
          <Button
            variant="ghost"
            size="xl"
            onClick={togglePlay}
            icon={isPlaying ? Pause : Play}
            className="text-white hover:bg-white hover:bg-opacity-20 bg-white bg-opacity-20 
                     w-16 h-16 rounded-full"
          />
          
          <Button
            variant="ghost"
            size="lg"
            onClick={nextTrack}
            icon={SkipForward}
            className="text-white hover:bg-white hover:bg-opacity-20"
          />
          
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleRepeat}
            icon={Repeat}
            className={`text-white hover:bg-white hover:bg-opacity-20 ${
              repeatMode !== 'off' ? 'text-green-400' : ''
            }`}
          />
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-gray-400 hover:text-red-400 cursor-pointer transition-colors" />
            <Share className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            <MoreHorizontal className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              icon={isMuted ? VolumeX : Volume2}
              className="text-white hover:bg-white hover:bg-opacity-20"
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
      </div>

      {/* Playlist Sidebar */}
      {showPlaylist && (
        <div className="fixed right-0 top-0 h-full w-96 bg-black bg-opacity-90 backdrop-blur-sm 
                       transform transition-transform z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Up Next</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPlaylist(false)}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-2">
              {samplePlaylist.map((track, index) => (
                <div
                  key={track.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    index === currentIndex 
                      ? 'bg-white bg-opacity-20' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-600 rounded-md mr-3 overflow-hidden">
                    <img
                      src={track.thumbnail}
                      alt={track.album}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{track.title}</h4>
                    <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatTime(track.duration)}
                  </div>
                  {index === currentIndex && (
                    <div className="ml-2">
                      <Music className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Background Animation */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 
                       animate-pulse"></div>
      </div>
    </div>
  );
};

export default MusicPlayer;
