import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-toss-large bg-white p-10 shadow-toss transition-all duration-300',
          glass && 'border border-white/20 bg-white/10 backdrop-blur-md shadow-xl',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
