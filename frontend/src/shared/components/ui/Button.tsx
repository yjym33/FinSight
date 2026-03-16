import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-toss-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-toss-blue text-white hover:brightness-110 active:scale-[0.98] shadow-lg shadow-toss-blue/20',
        secondary: 'bg-toss-bg dark:bg-slate-800 text-toss-text-secondary dark:text-slate-400 hover:brightness-110 active:scale-[0.98]',
        outline: 'border border-gray-200 dark:border-slate-800 bg-transparent text-toss-text-primary hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-[0.98]',
        ghost: 'text-toss-text-secondary hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-[0.98]',
        destructive: 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]',
      },
      size: {
        default: 'h-[56px] px-6 py-4 text-base',
        sm: 'h-[36px] px-3 py-1.5 text-sm',
        lg: 'h-[64px] px-8 py-5 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
