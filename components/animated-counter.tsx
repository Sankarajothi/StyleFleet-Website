'use client';

import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // ms, default 900
  prefix?: string;
  suffix?: string;
  className?: string;
  formatter?: (val: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 900,
  prefix = '',
  suffix = '',
  className = '',
  formatter,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimestampRef = useRef<number | null>(null);
  const startValueRef = useRef<number>(0);
  const targetValueRef = useRef<number>(value);

  useEffect(() => {
    startValueRef.current = 0;
    targetValueRef.current = value;
    startTimestampRef.current = null;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestampRef.current) startTimestampRef.current = timestamp;
      const progress = Math.min((timestamp - startTimestampRef.current) / duration, 1);
      
      // Deceleration curve (Ease-out cubic): starts fast, quickly runs and settles smoothly
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValueRef.current + (targetValueRef.current - startValueRef.current) * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValueRef.current);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const formatted = formatter
    ? formatter(displayValue)
    : displayValue.toLocaleString('en-IN');

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
