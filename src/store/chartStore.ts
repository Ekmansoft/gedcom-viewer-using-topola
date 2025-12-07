import { create } from 'zustand';
import type { ChartType } from '@/types/chart';

interface ChartStore {
  chartType: ChartType;
  generations: number;
  setChartType: (type: ChartType) => void;
  setGenerations: (generations: number) => void;
}

export const useChartStore = create<ChartStore>((set) => ({
  chartType: 'hourglass',
  generations: 4,
  setChartType: (type) => set({ chartType: type }),
  setGenerations: (generations) => set({ generations }),
}));
