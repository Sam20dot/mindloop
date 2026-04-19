'use client';

import { useEffect, useRef, useState } from 'react';

interface PointsBadgeProps {
  points: number;
}

export function PointsBadge({ points }: PointsBadgeProps) {
  const [displayed, setDisplayed] = useState(points);
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(points);

  useEffect(() => {
    if (points !== prevRef.current) {
      setFlash(true);
      const step = points > prevRef.current ? 1 : -1;
      const diff = Math.abs(points - prevRef.current);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setDisplayed((p) => p + step);
        if (count >= diff) {
          clearInterval(interval);
          setFlash(false);
        }
      }, 40);
      prevRef.current = points;
      return () => clearInterval(interval);
    }
  }, [points]);

  return (
    <div
      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold transition-all ${
        flash ? 'bg-yellow-100 text-yellow-700 scale-110' : 'bg-indigo-100 text-indigo-700'
      }`}
    >
      <span>⭐</span>
      <span>{displayed} pts</span>
    </div>
  );
}
