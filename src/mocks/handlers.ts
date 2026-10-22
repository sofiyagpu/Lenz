import { delay, http, HttpResponse, sse } from 'msw';
import type { AgentEvent, Part, Project, VersionData } from '../types';
import { checksEvent, finalVersion, followUp, pickTemplate, templates, type ScriptLine, type TemplateId } from './data';

type Stored = Project & { template: TemplateId };
type Client = { send: (message: { data: AgentEvent }) => void };

const KEY = 'lenz-mock-projects';
const seeds: Stored[] = (Object.keys(templates) as TemplateId[]).map((template, i) => ({
  id: `demo-${template}`,
  template,
  title: templates[template].title,
  prompt: templates[template].title,
  version: finalVersion(template),
  updatedAt: new Date(Date.UTC(2026, 9, 20 - i)).toISOString(),
}));

// ponytail: mock DB lives in localStorage so created projects survive a reload.
const load = (): Stored[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '') as Stored[];
  } catch {
    return seeds;
  }
};
const save = (all: Stored[]) => localStorage.setItem(KEY, JSON.stringify(all));
const find = (id: string) => load().find((p) => p.id === id);
const update = (id: string, patch: Partial<Stored>) =>
  save(load().map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)));

const clients = new Map<string, Client>();
const running = new Set<string>();
const waiting = new Map<string, { event: AgentEvent; resume: () => void }>();

function emit(id: string, event: AgentEvent) {
  try {
    clients.get(id)?.send({ data: event });
  } catch {
    clients.delete(id); // the page closed the stream
  }
}

/** Replays a script like a real agent would: with pauses, and stopping on questions and retryable errors. */
async function play(id: string, lines: ScriptLine[]) {
  running.add(id);
  for (const [ms, event] of lines) {
    await delay(ms);
    emit(id, event);
    if (event.type === 'version') update(id, { version: event.version });
    if (event.type === 'question' || (event.type === 'error' && event.retryable))
      await new Promise<void>((resume) => waiting.set(id, { event, resume }));
  }
  running.delete(id);
}

export const handlers = [
  http.get('/api/projects', () =>
    HttpResponse.json(load().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) as Project[]),
  ),

  http.post('/api/projects', async ({ request }) => {
    const { prompt } = (await request.json()) as { prompt: string };
    const template = pickTemplate(prompt);
    const id = `${template}-${Date.now().toString(36)}`;
    const title = prompt.length > 48 ? prompt.slice(0, 47) + '…' : prompt;
    save([...load(), { id, template, title, prompt, version: 0, updatedAt: new Date().toISOString() }]);
    return HttpResponse.json({ id });
  }),

  http.get('/api/projects/:id', ({ params }) => {
    const p = find(params.id as string);
    return p ? HttpResponse.json(p as Project) : new HttpResponse(null, { status: 404 });
  }),

  http.get('/api/projects/:id/versions/:v', ({ params }) => {
    const p = find(params.id as string);
    if (!p) return new HttpResponse(null, { status: 404 });
    // ponytail: every version returns the template's artifacts; real diffs come with the backend.
    return HttpResponse.json({ version: Number(params.v), ...templates[p.template].data } satisfies VersionData);
  }),

  sse('/api/projects/:id/events', ({ params, client }) => {
    const id = params.id as string;
    const p = find(id);
    if (!p) return client.error();
    clients.set(id, client as Client);
    const pending = waiting.get(id);
    if (pending) emit(id, pending.event);
    if (running.has(id)) return;
    if (p.version >= finalVersion(p.template)) {
      emit(id, { type: 'version', version: p.version, changed: [] });
      emit(id, checksEvent(p.template));
      const last = templates[p.template].script.findLast(([, e]) => e.type === 'message');
      if (last) emit(id, last[1]);
    } else void play(id, templates[p.template].script);
  }),

  http.post('/api/projects/:id/messages', async ({ params, request }) => {
    const id = params.id as string;
    const p = find(id);
    if (!p) return new HttpResponse(null, { status: 404 });
    const { text } = (await request.json()) as { text: string };
    const pending = waiting.get(id);
    if (pending) {
      waiting.delete(id);
      pending.resume();
    } else if (!running.has(id)) void play(id, followUp(text, p.version + 1));
    return HttpResponse.json({ ok: true }, { status: 202 });
  }),

  http.get('/api/inventory/search', ({ request }) => {
    const q = new URL(request.url).searchParams.get('q')?.toLowerCase() ?? '';
    const seen = new Map<string, Part>();
    for (const t of Object.values(templates))
      for (const part of t.data.parts)
        if (part.stock > 0 && `${part.value} ${part.factorySku}`.toLowerCase().includes(q)) seen.set(part.factorySku, part);
    return HttpResponse.json([...seen.values()]);
  }),
];
