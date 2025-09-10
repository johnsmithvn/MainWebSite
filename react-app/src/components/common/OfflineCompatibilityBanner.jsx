// 📁 src/components/common/OfflineCompatibilityBanner.jsx
// ⚠️ Banner hiển thị cảnh báo khi browser không hỗ trợ offline features

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ExternalLink, Shield } from 'lucide-react';
import { getOfflineSupport, isSecureContext } from '@/utils/browserSupport';

export default function OfflineCompatibilityBanner() {
  const [supportInfo, setSupportInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const info = getOfflineSupport();
    setSupportInfo(info);
    
    // Chỉ hiển thị banner khi có vấn đề về compatibility
    const shouldShow = !info.isSupported && !localStorage.getItem('offline-compatibility-dismissed');
    setIsVisible(shouldShow);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('offline-compatibility-dismissed', 'true');
  };

  const handleLearnMore = () => {
    // Scroll to Settings page hoặc mở modal với chi tiết
    if (window.location.pathname !== '/settings') {
      window.location.href = '/settings#browser-support';
    }
  };

  if (!supportInfo || !isVisible || isDismissed) return null;

  const { details } = supportInfo;

  const getMainIssue = () => {
    if (!details.secureContext) {
      return {
        icon: <Shield className="w-5 h-5 text-amber-500" />,
        title: 'HTTPS Required for Offline Features',
        message: 'Để sử dụng tính năng offline, vui lòng truy cập qua HTTPS hoặc localhost.',
        actionText: 'Learn about HTTPS setup',
        actionUrl: 'https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts'
      };
    }

    if (!details.cachesAPI) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        title: 'Browser Not Fully Supported',
        message: 'Browser này không hỗ trợ đầy đủ tính năng offline. Cập nhật browser để có trải nghiệm tốt nhất.',
        actionText: 'Update browser',
        actionUrl: 'https://browsehappy.com/'
      };
    }

    return {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      title: 'Limited Offline Support',
      message: 'Một số tính năng offline có thể không hoạt động trong môi trường này.',
      actionText: 'Check compatibility',
      actionUrl: null
    };
  };

  const issue = getMainIssue();

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {issue.icon}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            {issue.title}
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            {issue.message}
          </p>
          
          <div className="mt-3 flex space-x-3">
            {issue.actionUrl && (
              <a
                href={issue.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-amber-800 hover:text-amber-900 flex items-center gap-1"
              >
                {issue.actionText}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            
            <button
              onClick={handleLearnMore}
              className="text-sm font-medium text-amber-800 hover:text-amber-900"
            >
              View details
            </button>
          </div>
        </div>
        
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="inline-flex text-amber-400 hover:text-amber-600 focus:outline-none focus:text-amber-600"
          >
            <span className="sr-only">Dismiss</span>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
