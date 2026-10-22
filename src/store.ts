import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Level } from './types';

export type Tool = 'breadboard' | 'multimeter' | 'solder' | 'printer' | 'psu';
export type Source = 'factory' | 'kit' | 'buy';

interface Settings {
  level: Level;
  tools: Tool[];
  source: Source;
  onboarded: boolean;
  /** Prompt typed on the landing, kept through onboarding. */
  pendingPrompt: string;
  set: (patch: Partial<Omit<Settings, 'set'>>) => void;
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      level: 'hobby',
      tools: ['breadboard'],
      source: 'factory',
      onboarded: false,
      pendingPrompt: '',
      set,
    }),
    { name: 'lenz-settings' },
  ),
);

interface Editor {
  selected?: string;
  /** Version pinned from the chat; undefined means latest. */
  viewVersion?: number;
  select: (ref?: string) => void;
  setViewVersion: (v?: number) => void;
}

export const useEditor = create<Editor>()((set) => ({
  select: (selected) => set({ selected }),
  setViewVersion: (viewVersion) => set({ viewVersion }),
}));
