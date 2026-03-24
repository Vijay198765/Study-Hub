import React from 'react';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`}></div>
);

export const ClassCardSkeleton = () => (
  <div className="glass-card p-8 h-full min-h-[250px] flex flex-col">
    <div className="w-12 h-12 bg-white/5 rounded-xl mb-6 animate-pulse"></div>
    <div className="h-8 w-3/4 bg-white/5 rounded-lg mb-4 animate-pulse"></div>
    <div className="h-4 w-full bg-white/5 rounded-lg mb-2 animate-pulse"></div>
    <div className="h-4 w-2/3 bg-white/5 rounded-lg mb-8 animate-pulse"></div>
    <div className="mt-auto h-4 w-24 bg-white/5 rounded-lg animate-pulse"></div>
  </div>
);
