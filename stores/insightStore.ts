import { create } from 'zustand';
import { Insight } from '../types';

interface InsightState {
  insights: Insight[];
  isLoadingInsights: boolean;
}

export const useInsightStore = create<InsightState>(() => ({
  insights: [],
  isLoadingInsights: false,
}));