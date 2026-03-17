import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage the simulation playback loop.
 * @param initialSpeed Initial ticks per second (base speed).
 */
export const useSimulation = (initialSpeed = 1) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const [step, setStep] = useState(0);
  
  const lastTickTime = useRef<number>(0);
  const requestRef = useRef<number | undefined>(undefined);

  const tick = useCallback((time: number) => {
    if (!lastTickTime.current) {
      lastTickTime.current = time;
    }

    // Interval between steps in milliseconds.
    // Speed is the multiplier for "1 step per second".
    const interval = 1000 / speed;

    if (time - lastTickTime.current >= interval) {
      setStep((prev) => prev + 1);
      lastTickTime.current = time;
    }

    requestRef.current = requestAnimationFrame(tick);
  }, [speed]);

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
    setStep(0);
    lastTickTime.current = 0;
  };

  return { 
    isPlaying, 
    speed, 
    setSpeed, 
    step, 
    togglePlay, 
    reset 
  };
};
