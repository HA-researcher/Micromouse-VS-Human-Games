import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage the simulation playback loop.
 * @param onStep Optional callback called on every step (e.g., for direct canvas updates).
 * @param initialSpeed Initial ticks per second (base speed).
 */
export const useSimulation = (onStep?: (step: number) => void | Promise<void>, initialSpeed = 1) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  // Requirement 5.6: Animation step_index held in useRef to avoid React re-renders.
  const stepRef = useRef<number>(0);
  const [uiStep, setUiStep] = useState(0); // For low-frequency UI updates if needed
  
  const lastTickTime = useRef<number>(0);
  const requestRef = useRef<number | undefined>(undefined);
  const isProcessingRef = useRef<boolean>(false);

  const tick = useCallback((time: number) => {
    const loop = async (currentTime: number) => {
      if (!lastTickTime.current) {
        lastTickTime.current = currentTime;
      }

      const interval = 1000 / speed;

      if (currentTime - lastTickTime.current >= interval) {
        if (!isProcessingRef.current) {
          isProcessingRef.current = true;
          stepRef.current += 1;
          setUiStep(stepRef.current);
          
          if (onStep) {
            try {
              await onStep(stepRef.current);
            } catch (e) {
              console.error(e);
            }
          }
          
          isProcessingRef.current = false;
          lastTickTime.current = performance.now();
        }
      }

      if (isPlaying) {
        requestRef.current = requestAnimationFrame(loop);
      }
    };
    loop(time);
  }, [speed, onStep, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(tick);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      lastTickTime.current = 0;
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, tick]);

  const togglePlay = () => setIsPlaying((prev) => !prev);
  
  const reset = () => {
    setIsPlaying(false);
    stepRef.current = 0;
    setUiStep(0);
    lastTickTime.current = 0;
    if (onStep) onStep(0);
  };

  const stepForward = () => {
    setIsPlaying(false);
    stepRef.current += 1;
    setUiStep(stepRef.current);
    if (onStep) onStep(stepRef.current);
  };

  const stepBackward = () => {
    setIsPlaying(false);
    if (stepRef.current > 0) {
      stepRef.current -= 1;
      setUiStep(stepRef.current);
      if (onStep) onStep(stepRef.current);
    }
  };

  return { 
    isPlaying, 
    speed, 
    setSpeed, 
    step: uiStep, // Exposed to UI
    stepRef,      // Exposed for direct access if needed
    togglePlay, 
    reset,
    stepForward,
    stepBackward
  };
};
