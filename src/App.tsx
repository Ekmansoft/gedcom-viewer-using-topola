import { useGedcomStore } from '@/store/gedcomStore';
import MainLayout from '@/components/layout/MainLayout';
import WelcomeScreen from '@/components/layout/WelcomeScreen';
import ErrorBoundary from '@/components/common/ErrorBoundary';

function App() {
  const gedcomData = useGedcomStore((state) => state.gedcomData);
  
  return (
    <ErrorBoundary>
      {gedcomData ? <MainLayout /> : <WelcomeScreen />}
    </ErrorBoundary>
  );
}

export default App;
