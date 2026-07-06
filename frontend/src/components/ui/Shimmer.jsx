import React from 'react';
import { cn } from '../../utils/cn';

export const Shimmer = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-dark-border/50",
        className
      )}
      {...props}
    />
  );
};
