import { useFamilyStore } from '@/store/familyStore';
import MainLayout from '@/components/layout/MainLayout';
import WelcomeScreen from '@/components/layout/WelcomeScreen';
import ErrorBoundary from '@/components/common/ErrorBoundary';

function App() {
  const familyData = useFamilyStore((state) => state.familyData);
  
  return (
    <ErrorBoundary>
      {familyData ? <MainLayout /> : <WelcomeScreen />}
    </ErrorBoundary>
  );
}

export default App;
