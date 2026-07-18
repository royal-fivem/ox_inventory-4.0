import React, { useEffect, useState } from 'react';
import { getItemUrl } from '../../helpers';
import { QueueJob } from './types';
import { getItemLabel } from './craftingHelpers';

interface Props {
  /** max number of visible queue slots */
  slots: number;
  jobs: QueueJob[];
  onCancel: (uid: string) => void;
}

const CraftingQueue: React.FC<Props> = ({ slots, jobs, onCancel }) => {
  // tick so the active job's progress bar animates smoothly
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!jobs.some((j) => j.startedAt)) return;
    const interval = setInterval(() => forceTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, [jobs]);

  const cells = Array.from({ length: Math.max(slots, jobs.length) });

  const formatTime = (ms: number) => {
    const secs = Math.max(0, Math.ceil(ms / 1000));
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  };

  return (
    <div className="craft-queue">
      <div className="craft-queue-title">Crafting Queue</div>

      <div className="craft-queue-row">
        {cells.map((_, i) => {
          const job = jobs[i];

          if (!job) {
            return <div key={i} className="craft-queue-slot empty" />;
          }

          const elapsed = job.startedAt ? Date.now() - job.startedAt : 0;
          const remaining = job.recipe.duration - elapsed;
          const progress = job.startedAt
            ? Math.min(100, (elapsed / job.recipe.duration) * 100)
            : 0;

          return (
            <button
              key={job.uid}
              className={`craft-queue-slot filled ${job.startedAt ? 'active' : 'waiting'}`}
              style={{ backgroundImage: `url(${getItemUrl(job.recipe.result)})` }}
              title={`${job.recipe.label ?? getItemLabel(job.recipe.result)} — click to cancel`}
              onClick={() => onCancel(job.uid)}
            >
              {job.recipe.count > 1 && (
                <span className="craft-grid-count">x{job.recipe.count}</span>
              )}

              <span className="craft-queue-overlay">
                {job.startedAt ? formatTime(remaining) : 'Queued'}
              </span>

              <span className="craft-queue-track">
                <span className="craft-queue-progress" style={{ width: `${progress}%` }} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CraftingQueue;
