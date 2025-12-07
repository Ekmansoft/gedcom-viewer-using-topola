/**
 * Chart type definitions for Topola integration
 */
export type ChartType = 
  | 'hourglass'
  | 'ancestors'
  | 'descendants'
  | 'relatives';

export interface ChartOptions {
  type: ChartType;
  generations?: number;
  startIndi?: string;
}

export const CHART_CONFIGS: Record<ChartType, { label: string; icon: string; description: string }> = {
  hourglass: {
    label: 'Hourglass',
    icon: '⏳',
    description: 'Shows ancestors above and descendants below',
  },
  ancestors: {
    label: 'Ancestors',
    icon: '⬆️',
    description: 'Shows all ancestors in a tree',
  },
  descendants: {
    label: 'Descendants',
    icon: '⬇️',
    description: 'Shows all descendants in a tree',
  },
  relatives: {
    label: 'Relatives',
    icon: '👥',
    description: 'Shows close family members',
  },
};
