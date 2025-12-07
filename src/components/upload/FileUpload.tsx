import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useFamilyStore } from '@/store/familyStore';
import { GedcomParser } from '@/services/gedcomParser';
import { RelationshipGraphBuilder } from '@/services/relationshipGraphBuilder';

function FileUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadFamilyTree = useFamilyStore((state) => state.loadFamilyTree);
  const setRelationshipGraph = useFamilyStore((state) => state.setRelationshipGraph);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse GEDCOM file
      const parser = new GedcomParser();
      const data = await parser.parseFile(file);

      // Build relationship graph
      const builder = new RelationshipGraphBuilder();
      const graph = builder.build(data);

      // Update store
      loadFamilyTree(data, file.name);
      setRelationshipGraph(graph);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error loading GEDCOM:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFile(acceptedFiles[0]);
      }
    },
    accept: {
      'text/gedcom': ['.ged'],
      'text/plain': ['.ged'],
    },
    multiple: false,
    disabled: isLoading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-600">Parsing GEDCOM file...</p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-blue-500 mb-4" />
            <p className="text-lg font-medium text-gray-700">
              Drop your GEDCOM file here
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag & drop your GEDCOM file here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse
            </p>
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose File
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900">Error loading file</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
