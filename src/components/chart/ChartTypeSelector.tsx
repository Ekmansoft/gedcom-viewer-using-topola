import { ChevronDown } from 'lucide-react';
import { useChartStore } from '@/store/chartStore';
import { CHART_CONFIGS, type ChartType } from '@/types/chart';
import { useState, useRef, useEffect } from 'react';

function ChartTypeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const chartType = useChartStore((state) => state.chartType);
  const setChartType = useChartStore((state) => state.setChartType);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentConfig = CHART_CONFIGS[chartType];

  const handleSelect = (type: ChartType) => {
    setChartType(type);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-xl">{currentConfig.icon}</span>
        <span className="font-medium text-gray-700">{currentConfig.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          {(Object.entries(CHART_CONFIGS) as [ChartType, typeof CHART_CONFIGS[ChartType]][]).map(([type, config]) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              className={`
                w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors
                ${type === chartType ? 'bg-blue-100' : ''}
                ${type === 'hourglass' ? 'rounded-t-lg' : ''}
                ${type === 'relatives' ? 'rounded-b-lg' : ''}
                border-b border-gray-100 last:border-b-0
              `}
            >
              <div className="flex items-start space-x-3">
                <span className="text-xl">{config.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{config.label}</div>
                  <div className="text-sm text-gray-600 mt-0.5">{config.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChartTypeSelector;
