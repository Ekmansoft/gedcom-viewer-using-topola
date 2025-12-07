import { useState } from 'react';
import { Upload } from 'lucide-react';
import DataSourceSelector from '@/components/dataSource/DataSourceSelector';

function WelcomeScreen() {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Family Tree Viewer
          </h1>
          <p className="text-xl text-gray-600">
            Visualize and explore your family history with interactive genealogy charts
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <DataSourceSelector />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-blue-600 text-3xl mb-3">📁</div>
            <h3 className="font-semibold text-gray-900 mb-2">Multiple Sources</h3>
            <p className="text-sm text-gray-600">
              GEDCOM files or Geni.com connection
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-blue-600 text-3xl mb-3">🌳</div>
            <h3 className="font-semibold text-gray-900 mb-2">Multiple Views</h3>
            <p className="text-sm text-gray-600">
              Ancestor, descendant, and hourglass charts
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-blue-600 text-3xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900 mb-2">Search & Filter</h3>
            <p className="text-sm text-gray-600">
              Find anyone in your family tree instantly
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Built with React, TypeScript, and Topola genealogy library
          </p>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
