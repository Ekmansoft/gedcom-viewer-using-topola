import { useState } from 'react';
import { FileText, Globe } from 'lucide-react';
import FileUpload from '@/components/upload/FileUpload';
import GeniConnect from '@/components/geni/GeniConnect';
import type { DataSourceType } from '@/types/dataSource';

function DataSourceSelector() {
  const [selectedSource, setSelectedSource] = useState<DataSourceType>('gedcom');

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setSelectedSource('gedcom')}
          className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
            selectedSource === 'gedcom'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>GEDCOM File</span>
        </button>

        <button
          onClick={() => setSelectedSource('geni')}
          className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
            selectedSource === 'geni'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="w-5 h-5" />
          <span>Geni.com</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {selectedSource === 'gedcom' && <FileUpload />}
        {selectedSource === 'geni' && <GeniConnect />}
      </div>

      {/* Info Text */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {selectedSource === 'gedcom' ? (
          <p>Upload a GEDCOM file (.ged) from your computer</p>
        ) : (
          <p>Connect to your Geni.com account to access your online family tree</p>
        )}
      </div>
    </div>
  );
}

export default DataSourceSelector;
