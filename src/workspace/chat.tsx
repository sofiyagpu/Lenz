import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ArrowUp, ChevronDown, CircleCheck, CircleX, History, LoaderCircle, RotateCw } from 'lucide-react';
import { useEditor } from '../store';
import type { ChatItem } from './agent';

export function Chat({ items, send }: { items: ChatItem[]; send: (text: string) => Promise<unknown> }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [open, setOpen] = useState<number>();
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const setViewVersion = useEditor((s) => s.setViewVersion);
  useEffect(() => {
    void end.current?.scrollIntoView({ block: 'end' }); // newer browsers return a Promise here
  }, [items.length]);

  // A question or error is answered once anything is said after it.
  const answered = (i: number) => items.slice(i + 1).some((x) => x.type === 'user');
  const submit = (value = text) => {
    if (!value.trim()) return;
    void send(value.trim());
    setText('');
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
        {items.map((item, i) => {
          switch (item.type) {
            case 'user':
              return (
                <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-on-primary">
                  {item.text}
                </p>
              );
            case 'step': {
              const Icon = item.status === 'running' ? LoaderCircle : item.status === 'done' ? CircleCheck : CircleX;
              return (
                <div key={i} className="rounded-xl border border-line-soft bg-bg">
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left"
                    aria-expanded={item.detail ? open === i : undefined}
                    onClick={() => item.detail && setOpen(open === i ? undefined : i)}
                  >
                    <Icon
                      size={15}
                      className={clsx(item.status === 'running' && 'animate-spin text-faint', item.status === 'done' && 'text-pass', item.status === 'failed' && 'text-fail')}
                    />
                    <span className="sr-only">{t(`status.${item.status === 'done' ? 'pass' : item.status === 'failed' ? 'fail' : 'skipped'}`)}</span>
                    <span className="flex-1 text-[13px] font-medium">{item.label}</span>
                    {item.detail && <ChevronDown size={14} className={clsx('text-faint transition-transform', open === i && 'rotate-180')} />}
                  </button>
                  {open === i && <p className="px-3 pb-2.5 pl-8 text-[12px] text-muted">{item.detail}</p>}
                </div>
              );
            }
            case 'question':
              return (
                <div key={i} className="space-y-2 py-1">
                  <p className="font-medium">{item.text}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.options.map((o) => (
                      <button key={o} className="chip" disabled={answered(i)} onClick={() => submit(o)}>
                        {o}
                      </button>
                    ))}
                    <button className="chip" disabled={answered(i)} onClick={() => input.current?.focus()}>
                      {t('chat.own')}
                    </button>
                  </div>
                </div>
              );
            case 'version':
              return (
                <div key={i} className="flex items-center gap-2 py-1 text-[12px] text-muted">
                  <History size={13} />
                  <span>
                    {t('chat.version', { v: item.version })} · {item.changed.map((c) => t(`chat.changed.${c}`)).join(', ')}
                  </span>
                  <button className="ml-auto font-semibold text-accent hover:underline" onClick={() => setViewVersion(item.version)}>
                    {t('chat.revert')}
                  </button>
                </div>
              );
            case 'message':
              return (
                <p key={i} className="py-1 leading-relaxed">
                  {item.text}
                </p>
              );
            case 'error':
              return (
                <div key={i} role="alert" className="flex items-center gap-2 rounded-xl bg-fail-soft px-3 py-2 text-fail">
                  <CircleX size={15} />
                  <span className="flex-1 text-[13px]">{item.text}</span>
                  {item.retryable && (
                    <button className="btn btn-secondary min-h-8 px-3 text-text" disabled={answered(i)} onClick={() => submit(t('common.retry'))}>
                      <RotateCw size={13} />
                      {t('common.retry')}
                    </button>
                  )}
                </div>
              );
            case 'checks':
              return null;
          }
        })}
        <div ref={end} />
      </div>
      <form
        className="composer-box m-3 mt-0 rounded-2xl p-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <textarea
          ref={input}
          rows={2}
          value={text}
          aria-label={t('chat.placeholder')}
          placeholder={t('chat.placeholder')}
          className="!px-2.5 !py-2 !text-[14px]"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="flex justify-end">
          <button className="send-btn size-8" type="submit" disabled={!text.trim()} aria-label={t('common.send')}>
            <ArrowUp size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
