/**
 * 🔄 UI Switcher Component
 * Cho phép người dùng chuyển đổi giữa React app và Legacy frontend
 */
import { useState, useEffect } from 'react';
import Modal from './Modal';

export const UISwitcher = ({ isOpen, onClose }) => {
  const [currentUI, setCurrentUI] = useState('react');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get current UI preference
    fetch('/api/ui-preference')
      .then(res => res.json())
      .then(data => {
        setCurrentUI(data.detected || 'react');
      })
      .catch(console.error);
  }, []);

  const handleSwitchUI = async (uiType) => {
    if (uiType === currentUI) return;
    
    setLoading(true);
    
    try {
      // Save preference
      await fetch('/api/ui-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preference: uiType })
      });

      // Navigate to appropriate interface
      if (uiType === 'legacy') {
        window.location.href = '/?ui=legacy';
      } else {
        window.location.href = '/app?ui=react';
      }
    } catch (error) {
      console.error('Error switching UI:', error);
      setLoading(false);
    }
  };

  const interfaces = [
    {
      id: 'react',
      name: 'React App (V2)',
      icon: '⚡',
      description: 'Giao diện hiện đại với React, TailwindCSS và tối ưu hóa performance',
      features: ['Fast', 'Modern', 'PWA', 'Dark Mode'],
      status: 'Recommended'
    },
    {
      id: 'legacy',
      name: 'Legacy (V1)',
      icon: '🏛️',
      description: 'Giao diện truyền thống với đầy đủ tính năng đã được kiểm chứng',
      features: ['Stable', 'Complete', 'Classic', 'Proven'],
      status: 'Stable'
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔄 Interface Selector" size="lg">
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Chọn giao diện phù hợp với nhu cầu của bạn
        </p>
        
        <div className="grid gap-4">
          {interfaces.map((ui) => (
            <div
              key={ui.id}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${currentUI === ui.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${loading ? 'opacity-50 pointer-events-none' : ''}
              `}
              onClick={() => handleSwitchUI(ui.id)}
            >
              {/* Status Badge */}
              {ui.status && (
                <div className="absolute top-2 right-2">
                  <span className={`
                    px-2 py-1 text-xs rounded-full font-medium
                    ${ui.status === 'Recommended' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }
                  `}>
                    {ui.status}
                  </span>
                </div>
              )}

              {/* Current Selection Indicator */}
              {currentUI === ui.id && (
                <div className="absolute top-2 left-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 mt-2">
                <div className="text-3xl">{ui.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {ui.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {ui.description}
                  </p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-1">
                    {ui.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-700 dark:text-gray-300"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Loading Indicator */}
              {loading && currentUI !== ui.id && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Tip: Bạn có thể chuyển đổi bất kỳ lúc nào từ Settings hoặc thêm <code>?ui=react</code> / <code>?ui=legacy</code> vào URL
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => window.open('/?ui=legacy', '_blank')}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
          >
            🏛️ Preview Legacy
          </button>
          <button
            onClick={() => window.open('/app?ui=react', '_blank')}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50"
          >
            ⚡ Preview React
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UISwitcher;
