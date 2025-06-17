
import { useState, useEffect, useCallback } from 'react';

interface UseProgressiveLoadingOptions {
  delay?: number;
  stages?: string[];
}

interface UseProgressiveLoadingReturn {
  currentStage: number;
  isStageLoaded: (stage: number) => boolean;
  loadNextStage: () => void;
  resetStages: () => void;
  isComplete: boolean;
}

export const useProgressiveLoading = (
  options: UseProgressiveLoadingOptions = {}
): UseProgressiveLoadingReturn => {
  const { delay = 100, stages = ['initial', 'secondary', 'complete'] } = options;
  const [currentStage, setCurrentStage] = useState(0);

  const loadNextStage = useCallback(() => {
    setCurrentStage(prev => Math.min(prev + 1, stages.length - 1));
  }, [stages.length]);

  const resetStages = useCallback(() => {
    setCurrentStage(0);
  }, []);

  const isStageLoaded = useCallback((stage: number) => {
    return currentStage >= stage;
  }, [currentStage]);

  useEffect(() => {
    if (currentStage < stages.length - 1) {
      const timer = setTimeout(loadNextStage, delay);
      return () => clearTimeout(timer);
    }
  }, [currentStage, stages.length, delay, loadNextStage]);

  return {
    currentStage,
    isStageLoaded,
    loadNextStage,
    resetStages,
    isComplete: currentStage >= stages.length - 1
  };
};
