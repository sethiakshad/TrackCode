import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef(({ className, children, hoverEffect = false, ...props }, ref) => {
  const Component = hoverEffect ? motion.div : 'div';
  const hoverProps = hoverEffect ? {
    whileHover: { y: -4, transition: { duration: 0.2 } },
  } : {};

  return (
    <Component
      ref={ref}
      className={cn(
        'rounded-xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300',
        hoverEffect && 'hover:border-primary-500/30 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]',
        className
      )}
      {...hoverProps}
      {...props}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }) => {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className, children, ...props }) => {
  return (
    <h3 className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ className, children, ...props }) => {
  return (
    <p className={cn('text-sm text-dark-textMuted', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ className, children, ...props }) => {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ className, children, ...props }) => {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
};
