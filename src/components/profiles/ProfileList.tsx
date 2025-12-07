import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useGedcomStore } from '@/store/gedcomStore';
import VirtualProfileList from './VirtualProfileList';
import type { Profile } from '@/types/gedcom';

function ProfileList() {
  const [searchQuery, setSearchQuery] = useState('');
  const profiles = useFamilyStore((state) => state.getAllProfiles());
  
  // Filter profiles based on search
  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    
    const query = searchQuery.toLowerCase();
    return profiles.filter((profile) => {
      const firstName = profile.firstName?.toLowerCase() || '';
      const lastName = profile.lastName?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      return fullName.includes(query) ||
             firstName.includes(query) ||
             lastName.includes(query);
    });
  }, [profiles, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          {filteredProfiles.length} {filteredProfiles.length === 1 ? 'profile' : 'profiles'}
        </div>
      </div>

      <VirtualProfileList profiles={filteredProfiles} />
    </div>
  );
}

export default ProfileList;
