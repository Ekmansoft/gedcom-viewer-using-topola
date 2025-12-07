import { useState } from 'react';
import ChartView from '@/components/chart/ChartView';

function MainContent() {
  return (
    <main className="flex-1 overflow-hidden bg-gray-50">
      <ChartView />
    </main>
  );
}

export default MainContent;
