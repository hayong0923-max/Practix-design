'use client';

import { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} style={style} />
  );
}

export function SongListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-6 h-6 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SessionListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl">
          <div className="flex-1">
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="w-6 h-6 rounded" />
        </div>
      ))}
    </div>
  );
}

export function WaveformSkeleton() {
  return (
    <div className="bg-[#1a1a2e] rounded-xl p-4 h-36">
      <div className="flex items-end justify-center gap-1 h-full">
        {Array.from({ length: 40 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-1 bg-gray-700"
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function PracticePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-200 safe-top pb-3 px-4">
        <Skeleton className="h-5 w-16 mb-2" />
        <Skeleton className="h-6 w-48 mb-1" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Content skeleton */}
      <div className="bg-white mt-2 px-4 py-4">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Waveform skeleton */}
        <WaveformSkeleton />

        {/* Time skeleton */}
        <div className="flex justify-between mt-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>

      {/* Section list skeleton */}
      <div className="bg-white mt-2 px-4 py-4">
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-lg" />
                <Skeleton className="h-10 flex-1 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
