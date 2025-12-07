import { useEffect, useRef, useState } from 'react';
import { useFamilyStore } from '@/store/familyStore';
import { useChartStore } from '@/store/chartStore';
import { TopolaDataAdapter } from '@/services/topolaDataAdapter';
import ChartTypeSelector from './ChartTypeSelector';
import TopolaChart, { type TopolaChartHandle } from './TopolaChart';
import { ZoomIn, ZoomOut, Maximize2, Target } from 'lucide-react';

function ChartView() {
  const [zoom, setZoom] = useState(1);
  const chartRef = useRef<TopolaChartHandle>(null);
  const selectedProfileId = useFamilyStore((state) => state.selectedProfileId);
  const familyData = useFamilyStore((state) => state.familyData);
  const chartType = useChartStore((state) => state.chartType);

  if (!selectedProfileId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">Select a profile to view</p>
          <p className="text-sm">Choose someone from the list to see their family tree</p>
        </div>
      </div>
    );
  }

  if (!familyData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No data loaded</p>
          <p className="text-sm">Please upload a GEDCOM file</p>
        </div>
      </div>
    );
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.3));
  const handleResetZoom = () => setZoom(1);
  const handleCenter = () => {
    chartRef.current?.centerOnSelectedProfile();
  };

  return (
    <div className="w-full h-full relative bg-white flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white z-10">
        <ChartTypeSelector />
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={handleResetZoom}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Reset zoom"
          >
            <Maximize2 className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="h-6 w-px bg-gray-300 mx-1" />
          
          <button
            onClick={handleCenter}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Center on selected person"
          >
            <Target className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="ml-2 px-3 py-1 bg-gray-100 rounded text-sm font-medium text-gray-700">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-hidden">
        <TopolaChart
          ref={chartRef}
          gedcomData={familyData}
          selectedProfileId={selectedProfileId}
          chartType={chartType}
          zoom={zoom}
        />
      </div>
    </div>
  );
}

export default ChartView;
