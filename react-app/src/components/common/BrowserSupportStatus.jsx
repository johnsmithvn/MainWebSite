// 📁 src/components/common/BrowserSupportStatus.jsx
// 🔍 Component hiển thị trạng thái hỗ trợ browser

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Globe, Shield, Database } from 'lucide-react';
import { getOfflineSupport, logBrowserSupport } from '@/utils/browserSupport';

export default function BrowserSupportStatus({ showDetails = false }) {
  const [supportInfo, setSupportInfo] = useState(null);
  const [showDetailedInfo, setShowDetailedInfo] = useState(showDetails);

  useEffect(() => {
    const info = getOfflineSupport();
    setSupportInfo(info);
    
    // Log browser support info for debugging
    if (process.env.NODE_ENV === 'development') {
      logBrowserSupport();
    }
  }, []);

  if (!supportInfo) return null;

  const { isSupported, details } = supportInfo;

  const getSupportIcon = (supported) => {
    return supported ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getSupportText = (supported) => {
    return supported ? 'Supported' : 'Not supported';
  };

  const getOverallStatus = () => {
    if (isSupported) {
      return (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Offline features available</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Limited offline support</span>
        </div>
      );
    }
  };

  const getRecommendation = () => {
    if (!details.secureContext) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Access via HTTPS recommended</h4>
              <p className="text-sm text-blue-700 mt-1">
                Để sử dụng đầy đủ tính năng offline, vui lòng truy cập qua HTTPS hoặc localhost.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!details.cachesAPI) {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900">Browser update needed</h4>
              <p className="text-sm text-orange-700 mt-1">
                Browser này không hỗ trợ Caches API. Vui lòng cập nhật browser hoặc sử dụng Chrome/Firefox mới nhất.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {getOverallStatus()}
      
      {getRecommendation()}

      {showDetailedInfo && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Browser Support Details
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Secure Context (HTTPS/localhost)</span>
              <div className="flex items-center gap-2">
                {getSupportIcon(details.secureContext)}
                <span className={details.secureContext ? 'text-green-600' : 'text-red-600'}>
                  {getSupportText(details.secureContext)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Caches API</span>
              <div className="flex items-center gap-2">
                {getSupportIcon(details.cachesAPI)}
                <span className={details.cachesAPI ? 'text-green-600' : 'text-red-600'}>
                  {getSupportText(details.cachesAPI)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Service Worker</span>
              <div className="flex items-center gap-2">
                {getSupportIcon(details.serviceWorker)}
                <span className={details.serviceWorker ? 'text-green-600' : 'text-red-600'}>
                  {getSupportText(details.serviceWorker)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">IndexedDB</span>
              <div className="flex items-center gap-2">
                {getSupportIcon(details.indexedDB)}
                <span className={details.indexedDB ? 'text-green-600' : 'text-red-600'}>
                  {getSupportText(details.indexedDB)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Storage Quota API</span>
              <div className="flex items-center gap-2">
                {getSupportIcon(details.storageAPI)}
                <span className={details.storageAPI ? 'text-green-600' : 'text-red-600'}>
                  {getSupportText(details.storageAPI)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <p>Current URL: <code className="bg-gray-100 px-1 rounded">{window.location.href}</code></p>
            </div>
          </div>
        </div>
      )}

      {!showDetails && !showDetailedInfo && (
        <button
          onClick={() => setShowDetailedInfo(true)}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Show technical details
        </button>
      )}
    </div>
  );
}
