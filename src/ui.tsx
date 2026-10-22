import { useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import clsx from 'clsx';
import { CircleAlert, CircleCheck, CircleMinus, CircleX, Languages, Moon, Sun, TriangleAlert } from 'lucide-react';
import { post } from './api';
import { useSettings } from './store';
import type { CheckResult, Part } from './types';

export function Logo({ to = '/' }: { to?: string }) {
  const { t } = useTranslation();
  return (
    <Link to={to} className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight">
      <img src="/favicon.svg" alt="" width={26} height={26} />
      {t('brand')}
    </Link>
  );
}

const isDark = () =>
  document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;

export function ThemeToggle() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(isDark);
  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('lenz-theme', next);
    } catch {}
    window.dispatchEvent(new Event('lenz:theme'));
    setDark(!dark);
  };
  return (
    <button className="icon-btn" onClick={toggle} aria-label={t('common.theme')} title={t('common.theme')}>
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export function LangToggle() {
  const { t, i18n } = useTranslation();
  return (
    <button
      className="icon-btn w-auto px-2 gap-1.5 text-xs font-semibold"
      onClick={() => void i18n.changeLanguage(i18n.language.startsWith('ru') ? 'en' : 'ru')}
      aria-label={t('common.language')}
    >
      <Languages size={15} />
      <span className="hidden sm:inline">{t('common.language')}</span>
    </button>
  );
}

const statusStyle = {
  pass: ['text-pass bg-pass-soft', CircleCheck],
  warn: ['text-warn bg-warn-soft', TriangleAlert],
  fail: ['text-fail bg-fail-soft', CircleX],
  skipped: ['text-muted bg-raised', CircleMinus],
} as const;

/** Check status: colour + icon + text, never colour alone. */
export function StatusBadge({ status, label }: { status: CheckResult['status']; label?: string }) {
  const { t } = useTranslation();
  const [cls, Icon] = statusStyle[status];
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', cls)}>
      <Icon size={12} aria-hidden />
      {label ?? t(`status.${status}`)}
    </span>
  );
}

export const stockState = (p: Pick<Part, 'stock' | 'qty'>) =>
  p.stock <= 0 ? 'out' : p.stock < p.qty * 10 ? 'low' : 'inStock';

export function StockBadge({ part, showCount }: { part: Pick<Part, 'stock' | 'qty'>; showCount?: boolean }) {
  const { t } = useTranslation();
  const state = stockState(part);
  const [cls, Icon] = state === 'out' ? statusStyle.fail : state === 'low' ? [statusStyle.warn[0], CircleAlert] : statusStyle.pass;
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', cls)}>
      <Icon size={12} aria-hidden />
      {t(`status.${state}`)}
      {showCount && state !== 'out' && <span className="font-mono">· {part.stock}</span>}
    </span>
  );
}

export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => matchMedia(query).matches,
  );
}

/** Landing and /app both start projects here: new users go through onboarding first, prompt kept. */
export function useStartProject() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const start = async (prompt: string) => {
    const text = prompt.trim();
    if (!text || busy) return;
    const { onboarded, set } = useSettings.getState();
    if (!onboarded) {
      set({ pendingPrompt: text });
      return navigate('/onboarding');
    }
    setBusy(true);
    try {
      const { id } = await post<{ id: string }>('/projects', { prompt: text });
      set({ pendingPrompt: '' });
      navigate(`/p/${id}`);
    } finally {
      setBusy(false);
    }
  };
  return { start, busy };
}
