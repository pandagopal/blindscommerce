'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface ScrollAnimationWrapperProps {
  children: ReactNode;
  animation?: 'fadeIn' | 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'slideInUp';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
}

export default function ScrollAnimationWrapper({
  children,
  animation = 'fadeInUp',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  className = '',
  once = true
}: ScrollAnimationWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, once]);

  const getAnimationStyles = () => {
    const baseStyles = {
      transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
      transitionDelay: `${delay}ms`
    };

    const hiddenStyles: Record<string, React.CSSProperties> = {
      fadeIn: { opacity: 0 },
      fadeInUp: { opacity: 0, transform: 'translateY(30px)' },
      fadeInLeft: { opacity: 0, transform: 'translateX(-30px)' },
      fadeInRight: { opacity: 0, transform: 'translateX(30px)' },
      scaleIn: { opacity: 0, transform: 'scale(0.9)' },
      slideInUp: { opacity: 0, transform: 'translateY(50px)' }
    };

    const visibleStyles: React.CSSProperties = {
      opacity: 1,
      transform: 'translateY(0) translateX(0) scale(1)'
    };

    return {
      ...baseStyles,
      ...(isVisible ? visibleStyles : hiddenStyles[animation])
    };
  };

  return (
    <div
      ref={ref}
      className={className}
      style={getAnimationStyles()}
    >
      {children}
    </div>
  );
}

// Staggered animation for lists
interface StaggeredAnimationProps {
  children: ReactNode[];
  animation?: 'fadeIn' | 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  baseDelay?: number;
  staggerDelay?: number;
  duration?: number;
  className?: string;
  itemClassName?: string;
}

export function StaggeredAnimation({
  children,
  animation = 'fadeInUp',
  baseDelay = 0,
  staggerDelay = 100,
  duration = 600,
  className = '',
  itemClassName = ''
}: StaggeredAnimationProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <ScrollAnimationWrapper
          key={index}
          animation={animation}
          delay={baseDelay + index * staggerDelay}
          duration={duration}
          className={itemClassName}
        >
          {child}
        </ScrollAnimationWrapper>
      ))}
    </div>
  );
}
