import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({ className, type, icon, error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-textMuted">
          {icon}
        </div>
      )}
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-dark-border bg-dark-bg px-3 py-2 text-sm placeholder:text-dark-textMuted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 text-white transition-colors",
          icon && "pl-10",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
