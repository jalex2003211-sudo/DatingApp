import { useCallback, useEffect, useRef, useState } from 'react';

interface CountdownOptions {
  totalSeconds: number;
  onFinish: () => void;
}

export function useCountdownTimer({ totalSeconds, onFinish }: CountdownOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const endTimestampRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    endTimestampRef.current = Date.now() + remainingSeconds * 1000;
    clearCurrentInterval();
  }, [clearCurrentInterval, isRunning, remainingSeconds]);

  const tick = useCallback(() => {
    if (!endTimestampRef.current) return;
    const deltaMs = endTimestampRef.current - Date.now();
    const nextSeconds = Math.max(0, Math.ceil(deltaMs / 1000));
    setRemainingSeconds(nextSeconds);
    if (nextSeconds <= 0) {
      setIsRunning(false);
      clearCurrentInterval();
      onFinish();
    }
  }, [clearCurrentInterval, onFinish]);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    endTimestampRef.current = Date.now() + remainingSeconds * 1000;
    clearCurrentInterval();
    intervalRef.current = setInterval(tick, 250);
  }, [clearCurrentInterval, isRunning, remainingSeconds, tick]);

  const reset = useCallback(
    (newTotalSeconds: number = totalSeconds) => {
      clearCurrentInterval();
      setIsRunning(false);
      setRemainingSeconds(newTotalSeconds);
      endTimestampRef.current = null;
    },
    [clearCurrentInterval, totalSeconds],
  );

  useEffect(() => () => clearCurrentInterval(), [clearCurrentInterval]);

  return { remainingSeconds, isRunning, start, pause, reset };
}
