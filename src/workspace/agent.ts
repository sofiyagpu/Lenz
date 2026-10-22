import { useCallback, useEffect, useState } from 'react';
import { eventsUrl, post, ready } from '../api';
import type { AgentEvent } from '../types';

export type ChatItem = AgentEvent | { type: 'user'; text: string };
type Checks = Extract<AgentEvent, { type: 'checks' }>;

/** Subscribes to the agent's SSE stream and folds events into chat items and project state. */
export function useAgent(id: string) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [version, setVersion] = useState(0);
  const [checks, setChecks] = useState<Checks>();

  useEffect(() => {
    setItems([]);
    setVersion(0);
    setChecks(undefined);
    let source: EventSource | undefined;
    let closed = false;
    void ready.then(() => {
      if (closed) return;
      source = new EventSource(eventsUrl(id));
      source.onmessage = (m) => {
        const e = JSON.parse(m.data) as AgentEvent;
        if (e.type === 'version') setVersion(e.version);
        if (e.type === 'checks') return setChecks(e);
        if (e.type === 'version' && !e.changed.length) return; // replayed on reconnect, nothing new
        setItems((prev) => {
          // A step's status updates in place: running → done/failed.
          if (e.type === 'step') {
            const i = prev.findLastIndex((x) => x.type === 'step' && x.id === e.id);
            if (i >= 0 && (prev[i] as typeof e).status === 'running') return prev.with(i, e);
          }
          // A re-sent pending question after reconnect shouldn't duplicate.
          if (e.type === 'question' && prev.some((x) => x.type === 'question' && x.id === e.id)) return prev;
          return [...prev, e];
        });
      };
    });
    return () => {
      closed = true;
      source?.close();
    };
  }, [id]);

  const send = useCallback(
    (text: string) => {
      setItems((prev) => [...prev, { type: 'user', text }]);
      return post(`/projects/${id}/messages`, { text, attachments: [] });
    },
    [id],
  );

  const running = items.some((x, i) => x.type === 'step' && x.status === 'running' && !items.slice(i + 1).some((y) => y.type === 'step' && y.id === x.id));
  return { items, version, checks, running, send };
}
