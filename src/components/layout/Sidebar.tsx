import ProfileList from '@/components/profiles/ProfileList';

function Sidebar() {
  return (
    <aside className="w-96 bg-white border-r border-gray-200 flex flex-col">
      <ProfileList />
    </aside>
  );
}

export default Sidebar;
