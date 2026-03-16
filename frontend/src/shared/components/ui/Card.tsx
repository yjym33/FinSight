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
          'rounded-toss-large bg-white dark:bg-slate-900 p-10 shadow-toss border border-gray-100 dark:border-slate-800 transition-all duration-300',
          glass && 'border border-white/20 dark:border-slate-700/50 bg-white/10 dark:bg-slate-900/40 backdrop-blur-md shadow-xl',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
