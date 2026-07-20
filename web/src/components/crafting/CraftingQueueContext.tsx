import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { fetchNui } from '../../utils/fetchNui';
import { isEnvBrowser } from '../../utils/misc';
import { CraftRecipe, QueueJob } from './types';

export const QUEUE_SLOTS = 3;

interface CraftingQueueValue {
  jobs: QueueJob[];
  activeJob: QueueJob | null;
  enqueue: (recipe: CraftRecipe) => void;
  /** cancel a still-waiting job (does nothing to the active one) */
  cancel: (uid: string) => void;
  /** cancel whatever job is currently crafting */
  cancelActive: () => void;
}

const CraftingQueueContext = createContext<CraftingQueueValue | null>(null);

export const useCraftingQueue = () => {
  const ctx = useContext(CraftingQueueContext);
  if (!ctx) throw new Error('useCraftingQueue must be used within CraftingQueueProvider');
  return ctx;
};

/**
 * Holds the crafting queue at the app root so it keeps processing (and can be
 * shown in the right-side HUD) even after the inventory UI is closed.
 */
export const CraftingQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<QueueJob[]>([]);

  const craftOnServer = useCallback((recipe: CraftRecipe) => {
    if (isEnvBrowser()) return;
    fetchNui('craftPersonalRecipe', { recipeId: recipe.id, count: 1 }).catch(() => {});
  }, []);

  // Play a crafting emote on the ped while the queue is running, and stop it as
  // soon as the queue empties (all crafts done / cancelled).
  const emoteActiveRef = useRef(false);
  useEffect(() => {
    const crafting = jobs.length > 0;
    if (crafting === emoteActiveRef.current) return;
    emoteActiveRef.current = crafting;
    if (!isEnvBrowser()) fetchNui('craftingEmote', { active: crafting }).catch(() => {});
  }, [jobs]);

  // start the next waiting job when nothing is active
  useEffect(() => {
    if (jobs.some((j) => j.startedAt)) return;
    const next = jobs.find((j) => !j.startedAt);
    if (!next) return;
    setJobs((prev) => prev.map((j) => (j.uid === next.uid ? { ...j, startedAt: Date.now() } : j)));
  }, [jobs]);

  // complete the active job after its duration
  useEffect(() => {
    const active = jobs.find((j) => j.startedAt);
    if (!active || active.startedAt == null) return;
    const remaining = active.recipe.duration - (Date.now() - active.startedAt);
    const timer = setTimeout(() => {
      craftOnServer(active.recipe);
      setJobs((prev) => prev.filter((j) => j.uid !== active.uid));
    }, Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [jobs, craftOnServer]);

  const enqueue = useCallback((recipe: CraftRecipe) => {
    setJobs((prev) => {
      if (prev.length >= QUEUE_SLOTS + 2) return prev; // soft cap
      return [
        ...prev,
        {
          uid: `${recipe.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          recipe,
          startedAt: null,
        },
      ];
    });
  }, []);

  const cancel = useCallback((uid: string) => {
    setJobs((prev) => prev.filter((j) => j.uid !== uid || j.startedAt != null));
  }, []);

  const cancelActive = useCallback(() => {
    setJobs((prev) => prev.filter((j) => !j.startedAt));
  }, []);

  const activeJob = jobs.find((j) => j.startedAt) ?? null;

  return (
    <CraftingQueueContext.Provider value={{ jobs, activeJob, enqueue, cancel, cancelActive }}>
      {children}
    </CraftingQueueContext.Provider>
  );
};
