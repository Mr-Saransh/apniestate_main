import { useEffect, useRef, useState } from 'react';

// Animated number counter for dashboard KPIs
export function AnimatedNumber({ value, prefix = '', suffix = '', duration = 800 }: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }

    const start = prevRef.current;
    const end = value;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let animId: number;

    const tick = (now: number) => {
      const currentNow = typeof now === 'number' && !isNaN(now) ? now : (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const elapsed = currentNow - startTime;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(current);
      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    prevRef.current = end;

    return () => {
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, [value, duration]);

  return <span>{prefix}{display.toLocaleString('en-IN')}{suffix}</span>;
}

// Circular progress ring for project health
export function ProgressRing({ value, size = 56, strokeWidth = 5, color }: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const ringColor = color || (
    value >= 80 ? '#10B981' :
    value >= 60 ? '#F59E0B' :
    value >= 40 ? '#3B82F6' : '#EF4444'
  );

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.06)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={ringColor}
        fontSize={size * 0.22}
        fontWeight={700}
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {value}%
      </text>
    </svg>
  );
}
