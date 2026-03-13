import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-[56px] w-full items-center rounded-toss-base bg-toss-bg px-5 py-4 text-[16px] text-toss-text-primary transition-all placeholder:text-toss-text-placeholder focus:bg-white focus:outline-none focus:ring-2 focus:ring-toss-blue/50 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
