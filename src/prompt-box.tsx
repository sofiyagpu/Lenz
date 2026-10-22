import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp, LoaderCircle } from 'lucide-react';
import { useStartProject } from './ui';

/** Lovable-style prompt with example chips; used on the landing and /app. */
export function PromptBox({ autoFocus }: { autoFocus?: boolean }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const { start, busy } = useStartProject();
  const examples = t('landing.examples', { returnObjects: true }) as string[];
  return (
    <div className="w-full">
      <form
        className="composer-box"
        onSubmit={(e) => {
          e.preventDefault();
          void start(text);
        }}
      >
        <label className="visually-hidden" htmlFor="prompt">
          {t('landing.placeholder')}
        </label>
        <textarea
          id="prompt"
          rows={3}
          autoFocus={autoFocus}
          value={text}
          placeholder={t('landing.placeholder')}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void start(text);
            }
          }}
        />
        <div className="flex justify-end p-1">
          <button className="send-btn" type="submit" disabled={!text.trim() || busy} aria-label={t('common.send')}>
            {busy ? <LoaderCircle size={18} className="animate-spin" /> : <ArrowUp size={18} />}
          </button>
        </div>
      </form>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {examples.map((ex) => (
          <button key={ex} className="chip" type="button" onClick={() => setText(ex)}>
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
