import React, { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useInView } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
}

export function AnimatedNumber({ value, format }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 100, mass: 1 });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [value, motionValue, isInView]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = format ? format(Math.round(latest)) : Math.round(latest).toString();
      }
    });
  }, [springValue, format]);

  return <span ref={ref}>{format ? format(0) : 0}</span>;
}
