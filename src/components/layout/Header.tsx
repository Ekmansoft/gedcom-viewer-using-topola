import { useRef } from 'react';
import { Menu, FileText, Settings, FolderOpen } from 'lucide-react';
import { useGedcomStore } from '@/store/gedcomStore';
import { GedcomParser } from '@/services/gedcomParser';
import { RelationshipGraphBuilder } from '@/services/relationshipGraphBuilder';

interface HeaderProps {
  onToggleSidebar: () => void;
}

function Header({ onToggleSidebar }: HeaderProps) {
  const fileName = useGedcomStore((state) => state.fileName);
  const profileCount = useGedcomStore((state) => state.gedcomData?.indis.length || 0);
  const loadGedcom = useGedcomStore((state) => state.loadGedcom);
  const setRelationshipGraph = useGedcomStore((state) => state.setRelationshipGraph);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parser = new GedcomParser();
      const data = await parser.parseFile(file);
      const builder = new RelationshipGraphBuilder();
      const graph = builder.build(data);
      loadGedcom(data, file.name);
      setRelationshipGraph(graph);
      console.log('New GEDCOM loaded:', {
        profiles: data.indis.length,
        families: data.fams.length,
      });
    } catch (err) {
      console.error('Error loading GEDCOM:', err);
      alert('Failed to load GEDCOM file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {fileName || 'Family Tree'}
            </h1>
            <p className="text-sm text-gray-500">
              {profileCount} {profileCount === 1 ? 'profile' : 'profiles'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".ged"
          onChange={handleFileSelect}
          className="hidden"
        />
        {fileName && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Load new file"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Load New File</span>
          </button>
        )}
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </header>
  );
}

export default Header;
