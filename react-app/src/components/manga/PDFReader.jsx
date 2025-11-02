// 📁 src/components/manga/PDFReader.jsx
// 📄 PDF Reader with WebView detection
// ✅ Browser: iframe display | WebView: download prompt

import React, { useState, useEffect, useRef } from 'react';

const PDFReader = ({ url, onLoadSuccess, onLoadError, currentPage = 1 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const blobUrlRef = useRef(null);
  const [isWebView, setIsWebView] = useState(false);

  // Detect if running in WebView
  useEffect(() => {
    const checkWebView = () => {
      // Check for Android WebView JavascriptInterface
      const hasAndroidInterface = typeof window.Android !== 'undefined' && 
                                   typeof window.Android.isWebView === 'function';
      
      // Additional WebView detection (user agent)
      const ua = navigator.userAgent.toLowerCase();
      const isAndroidWebView = ua.includes('wv') || 
                               (ua.includes('android') && !ua.includes('chrome'));
      
      return hasAndroidInterface || isAndroidWebView;
    };
    
    setIsWebView(checkWebView());
  }, []);

  // Fetch PDF and create blob URL (only for browser, skip for WebView)
  useEffect(() => {
    console.log('📄 PDFReader mounted, loading:', url);
    console.log('📱 Is WebView:', isWebView);
    
    // ✅ Skip fetch for WebView - just show the open button
    if (isWebView) {
      console.log('⏩ WebView detected, skipping PDF fetch');
      setLoading(false);
      return;
    }
    
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch PDF as blob
        console.log('🔄 Fetching PDF...');
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('✅ PDF blob received:', blob.size, 'bytes');
        
        // Create object URL
        const objectUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objectUrl;
        setBlobUrl(objectUrl);
        
        console.log('✅ PDF blob URL created:', objectUrl);
        
        if (onLoadSuccess) {
          onLoadSuccess(1); // Mock page count
        }
      } catch (err) {
        console.error('❌ PDF fetch error:', err);
        setError(err.message || 'Không thể tải PDF');
        setLoading(false);
        if (onLoadError) {
          onLoadError(err);
        }
      }
    };
    
    loadPDF();
    
    // Cleanup blob URL on unmount
    return () => {
      if (blobUrlRef.current) {
        console.log('🧹 Revoking blob URL:', blobUrlRef.current);
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [url, onLoadSuccess, onLoadError, isWebView]);

  const handleLoad = () => {
    console.log('✅ PDF iframe loaded');
    setLoading(false);
    setError(null);
  };

  const handleError = (e) => {
    console.error('❌ PDF iframe load error:', e);
    setError('Không thể hiển thị PDF');
    setLoading(false);
  };

  // Handle download for WebView (simplified - always download)
  const handleDownloadPDFWebView = async (e) => {
    // ✅ Prevent default behavior and event bubbling
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      // Extract proper filename from URL
      let fileName = 'document.pdf';
      
      try {
        const urlObj = new URL(url, window.location.origin);
        const pathParam = urlObj.searchParams.get('path');
        
        if (pathParam) {
          // Get last segment from path
          const pathSegments = pathParam.split('_');
          const lastSegment = pathSegments[pathSegments.length - 1];
          fileName = `${decodeURIComponent(lastSegment)}.pdf`;
        }
      } catch (urlError) {
        console.warn('⚠️ Failed to parse URL for filename, using default');
      }
      
      // ✅ Convert relative URL to absolute URL using Web API (like Music download)
      const absoluteUrl = new URL(url, window.location.origin).href;
      console.log('📥 Download PDF:', { original: url, absolute: absoluteUrl, fileName });
      
      // Check if Android download interface is available
      if (typeof window.Android !== 'undefined' && typeof window.Android.downloadFile === 'function') {
        // Use Android native download with absolute URL
        console.log('� Using Android native download for PDF:', fileName);
        window.Android.downloadFile(absoluteUrl, fileName, 'application/pdf');
      } else {
        // Fallback: Browser download
        console.log('📥 Downloading PDF via browser fallback:', fileName);
        handleDownloadPDF(e);
      }
    } catch (err) {
      console.error('❌ PDF download error:', err);
      alert('Không thể tải PDF: ' + err.message);
    }
  };

  // Handle download for browser (offline support)
  const handleDownloadPDF = async (e) => {
    // ✅ Prevent default behavior and event bubbling
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      console.log('📥 Downloading PDF for offline:', url);
      
      // Extract filename from URL query param "path"
      let fileName = 'document.pdf';
      
      try {
        const urlObj = new URL(url, window.location.origin);
        const pathParam = urlObj.searchParams.get('path');
        
        if (pathParam) {
          // Get last segment from path (e.g., "folder_title_chapter" -> "chapter.pdf")
          const pathSegments = pathParam.split('_');
          const lastSegment = pathSegments[pathSegments.length - 1];
          fileName = `${decodeURIComponent(lastSegment)}.pdf`;
        }
      } catch (urlError) {
        console.warn('⚠️ Failed to parse URL for filename, using default');
      }
      
      console.log('📝 Download filename:', fileName);
      
      // Fetch PDF if not already loaded
      let blob;
      if (blobUrlRef.current) {
        // Use existing blob
        const response = await fetch(blobUrlRef.current);
        blob = await response.blob();
      } else {
        // Fetch new
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        blob = await response.blob();
      }
      
      // Create download link
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup after download
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 100);
      
      console.log('✅ PDF download initiated:', fileName);
    } catch (err) {
      console.error('❌ Download error:', err);
      alert('Không thể tải PDF: ' + err.message);
    }
  };

  return (
    <div className="pdf-reader-container" style={{ 
      width: '100%', 
      height: '100vh',
      position: 'relative',
      backgroundColor: '#1a1a1a'
    }}>
      {loading && (
        <div className="flex items-center justify-center" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10
        }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải PDF...</p>
          </div>
        </div>
      )}

      {error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-500">
            <p className="text-xl mb-2">❌ {error}</p>
            <p className="text-sm text-gray-400 mt-2">Original URL: {url}</p>
          </div>
        </div>
      ) : isWebView ? (
        // WebView mode: Show download prompt
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white px-6">
            <div className="mb-6">
              <svg 
                className="w-24 h-24 mx-auto mb-4 text-blue-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
                />
              </svg>
              <h2 className="text-2xl font-bold mb-2">📄 File PDF</h2>
              <p className="text-gray-400 mb-4">
                WebView không hỗ trợ hiển thị PDF trực tiếp
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleDownloadPDFWebView}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-colors duration-200 inline-flex items-center"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                />
              </svg>
              Tải xuống PDF
            </button>
            
            <p className="text-gray-500 text-sm mt-4">
              Download để xem bằng ứng dụng đọc PDF
            </p>
          </div>
        </div>
      ) : blobUrl ? (
        // Browser mode: Display in iframe with download button
        <>
          <iframe
            src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: loading ? 'none' : 'block'
            }}
            title="PDF Viewer"
            onLoad={handleLoad}
            onError={handleError}
          />
          
          {/* Download button overlay */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-full shadow-2xl transition-all duration-200 inline-flex items-center z-50 hover:scale-105"
            title="Tải xuống PDF để xem offline"
            style={{
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(59, 130, 246, 0.9)'
            }}
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
              />
            </svg>
            <span className="hidden sm:inline">Tải xuống</span>
            <span className="sm:hidden">Download</span>
          </button>
        </>
      ) : null}
    </div>
  );
};

export default PDFReader;
