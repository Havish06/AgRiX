'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAdvisory } from '@/lib/api/hooks';

export default function AdvisoryPage() {
  const { data, isLoading, error } = useAdvisory('US-IA', 'maize', { horizon: 3, nSimulations: 1000 });

  return (
    <div className="min-h-screen bg-background/90">
      <h1 className="text-3xl font-serif my-8">Advisory Portal</h1>
      {isLoading && <p>Loading advisory...</p>}
      {error && <p className="text-risk-moderate">Error loading advisory</p>}
      {data && (
        <div className="p-6 bg-surface rounded-md">
          <h2 className="text-xl font-medium my-4">Advisory Actions</h2>
          {data.actions?.length > 0 ? (
            <ul>
              {data.actions.map((action: any, i: number) => (
                <li key={action.date}>
                  <div className="border rounded p-4 mb-3">
                    <h3>{action.title}</h3>
                    <p>{action.rationale}</p>
                    <p className="text-small text-muted">Category: {action.category}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p>No advisory actions available</p>}
        </div>
      )}
    </div>
  );
}