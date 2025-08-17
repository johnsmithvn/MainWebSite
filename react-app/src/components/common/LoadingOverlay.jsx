// 📁 src/components/common/LoadingOverlay.jsx
// ⏳ Loading overlay component với hiệu ứng đẹp

import React from 'react';
import { motion } from 'framer-motion';

const LoadingOverlay = ({ loading = false, className = "", message = "Đang tải..." }) => {
  if (!loading) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          mass: 0.8
        }}
        className="relative bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-white/10"
      >
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
            />
          ))}
        </div>

        <div className="relative flex flex-col items-center space-y-6">
          {/* Main spinner với multiple rings */}
          <div className="relative">
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-2 border-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 p-1"
            >
              <div className="w-full h-full rounded-full bg-white/10 dark:bg-black/40 backdrop-blur-xl" />
            </motion.div>
            
            {/* Middle ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 w-12 h-12 rounded-full border-2 border-transparent bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 p-1"
            >
              <div className="w-full h-full rounded-full bg-white/10 dark:bg-black/40 backdrop-blur-xl" />
            </motion.div>
            
            {/* Inner dot */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute inset-6 w-4 h-4 bg-gradient-to-br from-white to-gray-300 dark:from-gray-200 dark:to-gray-400 rounded-full shadow-lg"
            />
          </div>

          {/* Pulsing dots */}
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
              />
            ))}
          </div>

          {/* Message với typewriter effect */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <motion.p 
              className="text-lg font-semibold bg-gradient-to-r from-white via-gray-100 to-gray-200 dark:from-gray-100 dark:via-white dark:to-gray-200 bg-clip-text text-transparent"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {message}
            </motion.p>
            
            {/* Loading progress bar */}
            <div className="mt-3 w-48 h-1 bg-white/20 dark:bg-black/20 rounded-full overflow-hidden">
              <motion.div
                animate={{ x: [-192, 192] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="h-full w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full"
              />
            </div>
          </motion.div>
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-500/20 blur-xl -z-10" />
      </motion.div>
    </motion.div>
  );
};

export default LoadingOverlay;
