import React, { createContext, useContext, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { toast } from 'sonner';

interface WindowDetectionContextType {
  model: tf.GraphModel | null;
  isLoading: boolean;
  error: Error | null;
}

const WindowDetectionContext = createContext<WindowDetectionContextType>({
  model: null,
  isLoading: true,
  error: null
});

export function useWindowDetection() {
  return useContext(WindowDetectionContext);
}

export function WindowDetectionProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadModel() {
      try {
        const loadedModel = await tf.loadGraphModel('/models/window-detection/model.json');
        setModel(loadedModel);
      } catch (err) {
        console.error('Failed to load window detection model:', err);
        setError(err instanceof Error ? err : new Error('Failed to load model'));
        toast.error('Failed to load window detection model');
      } finally {
        setIsLoading(false);
      }
    }

    loadModel();
  }, []);

  return (
    <WindowDetectionContext.Provider value={{ model, isLoading, error }}>
      {children}
    </WindowDetectionContext.Provider>
  );
}
