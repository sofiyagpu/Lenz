// Contract from docs/SPEC.md §11.
export type Level = 'zero' | 'hobby' | 'engineer';

export interface Part {
  ref: string;
  value: string;
  package: string;
  qty: number;
  factorySku: string;
  stock: number;
  bin?: string;
  price?: number;
  datasheetUrl?: string;
  params: Record<string, string>;
  explain?: Record<Level, string>;
}

export interface CheckResult {
  id: string;
  layer: 'rules' | 'spice' | 'firmware' | 'parasitics' | 'drc';
  status: 'pass' | 'warn' | 'fail' | 'skipped';
  title: string;
  partRefs: string[];
  value?: string;
  limit?: string;
  explain: Record<Level, string>;
  fixHint?: string;
  plotUrl?: string;
}

export interface AssemblyStep {
  n: number;
  kind: 'rail' | 'chip' | 'passive' | 'wire' | 'power' | 'checkpoint';
  partRef?: string;
  holes: string[];
  wireColor?: string;
  text: Record<Level, string>;
  checkpoint?: { probe: [string, string]; min: number; max: number; unit: string };
}

export interface BreadboardLayout {
  board: 'half' | 'full';
  parts: { ref: string; pins: Record<string, string> }[]; // { "1": "E12" }
  wires: { from: string; to: string; color: string }[]; // "A12" → "+rail"
}

export type Artifact = 'schematic' | 'breadboard' | 'pcb' | 'enclosure' | 'firmware';

export type AgentEvent =
  | { type: 'step'; id: string; label: string; status: 'running' | 'done' | 'failed'; detail?: string }
  | { type: 'question'; id: string; text: string; options: string[] }
  | { type: 'version'; version: number; changed: Artifact[] }
  | { type: 'checks'; pass: number; warn: number; fail: number }
  | { type: 'message'; text: string }
  | { type: 'error'; text: string; retryable: boolean };

export interface Project {
  id: string;
  title: string;
  prompt: string;
  version: number;
  updatedAt: string;
}

export interface VersionData {
  version: number;
  parts: Part[];
  checks: CheckResult[];
  summary: { power: string; current: string; board: [number, number] };
}
