import * as React from 'react';

import { cn } from '../../utils';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'file:text-foreground placeholder:text-[color:var(--placeholder)] selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 border border-solid border-input bg-input px-3 py-1 text-base outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-[color,box-shadow] focus-visible:border-primary aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]',
  {
    variants: {
      variant: {
        default: '',
      },
      size: {
        /** Стандарт: 40px, фон/бордер --input (BDS gray-ele-line), radius 4px */
        default: 'h-10 rounded-[var(--size-4,4px)]',
        xs: 'h-5 rounded text-[11px] gap-1.5 px-2 has-[>svg]:px-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Input = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<'input'>, 'size'> & VariantProps<typeof inputVariants>
>(({ className, type, variant, size, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, size, className }))}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
