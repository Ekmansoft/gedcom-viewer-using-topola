import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useGedcomStore } from '@/store/gedcomStore';
import ProfileCard from './ProfileCard';
import type { Profile } from '@/types/gedcom';

interface VirtualProfileListProps {
  profiles: Profile[];
}

function VirtualProfileList({ profiles }: VirtualProfileListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const selectedProfileId = useGedcomStore((state) => state.selectedProfileId);
  const selectProfile = useGedcomStore((state) => state.selectProfile);

  const virtualizer = useVirtualizer({
    count: profiles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  if (profiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="text-gray-500">
          <p className="text-lg font-medium mb-2">No profiles found</p>
          <p className="text-sm">Try adjusting your search query</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const profile = profiles[virtualRow.index];
          return (
            <div
              key={profile.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ProfileCard
                profile={profile}
                isSelected={profile.id === selectedProfileId}
                onClick={() => {
                  selectProfile(profile.id);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualProfileList;
