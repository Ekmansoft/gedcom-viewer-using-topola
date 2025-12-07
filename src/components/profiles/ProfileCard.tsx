import { User } from 'lucide-react';
import type { Profile } from '@/types/family';

interface ProfileCardProps {
  profile: Profile;
  isSelected: boolean;
  onClick: () => void;
}

function ProfileCard({ profile, isSelected, onClick }: ProfileCardProps) {
  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(' ') || 'Unknown';

  const birthYear = profile.birth?.date?.year;
  const deathYear = profile.death?.date?.year;
  const lifespan = birthYear
    ? `${birthYear}${deathYear ? ` – ${deathYear}` : ''}`
    : '';

  const sexIcon = profile.sex === 'M' ? '♂' : profile.sex === 'F' ? '♀' : '';

  return (
    <button
      onClick={onClick}
      className={`
        w-full px-4 py-3 text-left transition-colors
        border-b border-gray-100 hover:bg-blue-50
        ${isSelected ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${profile.sex === 'M' ? 'bg-blue-100 text-blue-600' : 
            profile.sex === 'F' ? 'bg-pink-100 text-pink-600' : 
            'bg-gray-100 text-gray-600'}
        `}>
          {sexIcon ? (
            <span className="text-xl font-bold">{sexIcon}</span>
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {fullName}
          </p>
          {lifespan && (
            <p className="text-sm text-gray-600">
              {lifespan}
            </p>
          )}
          {profile.birth?.place && (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {profile.birth.place}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

export default ProfileCard;
