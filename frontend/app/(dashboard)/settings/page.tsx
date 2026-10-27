'use client';

import { CheckCircle2, Database, Key, Palette, Play, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { env } from '@/lib/constants/env';
import { useRunPipeline } from '@/lib/api/hooks';

export default function SettingsPage() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saved, setSaved] = useState(false);
  const pipeline = useRunPipeline();

  useEffect(() => {
    setReducedMotion(localStorage.getItem('agrix-reduced-motion') === 'true');
  }, []);

  const save = () => {
    localStorage.setItem('agrix-reduced-motion', String(reducedMotion));
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
    setSaved(true);
  };

  return (
    <div className="animate-fade-in max-w-3xl space-y-8">
      <header>
        <h1 className="font-serif text-display-md text-text">Settings</h1>
        <p className="mt-1 text-body text-text-muted">
          Local display preferences and backend configuration reference.
        </p>
      </header>
      <section className="card panel-raised" aria-labelledby="appearance-heading">
        <h2
          id="appearance-heading"
          className="mb-6 flex items-center gap-2 font-serif text-heading-md text-text"
        >
          <Palette className="h-5 w-5 text-primary" aria-hidden="true" />
          Appearance
        </h2>
        <label className="flex items-center justify-between gap-4">
          <span>
            <strong className="block text-text">Reduced motion</strong>
            <span className="text-body-sm text-text-muted">
              Minimize transitions and animations.
            </span>
          </span>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => {
              setReducedMotion(event.target.checked);
              setSaved(false);
            }}
            className="h-5 w-5 accent-primary"
          />
        </label>
      </section>
      <section className="card panel-raised" aria-labelledby="api-heading">
        <h2
          id="api-heading"
          className="mb-4 flex items-center gap-2 font-serif text-heading-md text-text"
        >
          <Key className="h-5 w-5 text-primary" aria-hidden="true" />
          Backend connection
        </h2>
        <dl className="space-y-3 text-body-sm">
          <div>
            <dt className="text-text-muted">API URL</dt>
            <dd className="mt-1 break-all font-mono text-text">{env.NEXT_PUBLIC_API_URL}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Configuration</dt>
            <dd className="mt-1 text-text">
              Set NEXT_PUBLIC_API_URL before starting the frontend.
            </dd>
          </div>
        </dl>
      </section>
      <section className="card panel-raised" aria-labelledby="data-heading">
        <h2
          id="data-heading"
          className="mb-4 flex items-center gap-2 font-serif text-heading-md text-text"
        >
          <Database className="h-5 w-5 text-primary" aria-hidden="true" />
          Data pipeline
        </h2>
        <p className="text-body-sm text-text-muted">
          Fetches NASA POWER climate and national yield data, generates the documented synthetic
          credit panel, builds feature matrices, trains the model zoo, and registers everything.
          Takes a few minutes on first run (live API fetches + 30 model fits).
        </p>
        <button
          type="button"
          onClick={() => pipeline.mutate()}
          disabled={pipeline.isPending}
          className="btn-raised btn-primary mt-4 inline-flex items-center gap-2"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          {pipeline.isPending ? 'Pipeline running…' : 'Run full pipeline'}
        </button>
        {pipeline.isSuccess && (
          <p className="mt-3 flex items-center gap-2 text-body-sm text-primary" role="status">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Pipeline completed — {pipeline.data.models_trained} models trained.
          </p>
        )}
        {pipeline.isError && (
          <p className="mt-3 text-body-sm text-risk-high" role="alert">
            Pipeline failed: {pipeline.error.message}
          </p>
        )}
      </section>
      <div className="flex items-center justify-end gap-4">
        <p className="text-body-sm text-text-muted" role="status">
          {saved ? 'Preference saved in this browser.' : ''}
        </p>
        <button
          type="button"
          onClick={save}
          className="btn-raised btn-primary inline-flex items-center gap-2"
        >
          <Save className="h-5 w-5" aria-hidden="true" />
          Save preference
        </button>
      </div>
    </div>
  );
}
