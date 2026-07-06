import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark-bg p-4 text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary-600/10 blur-[100px]" />
      
      <div className="z-10 space-y-6">
        <h1 className="text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary-400 to-cyan-400">
          404
        </h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Page not found</h2>
          <p className="text-dark-textMuted max-w-sm mx-auto">
            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>
        <div className="pt-4">
          <Link to="/">
            <Button size="lg" className="rounded-full shadow-lg shadow-primary-500/20">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
