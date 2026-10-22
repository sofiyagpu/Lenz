import { useTranslation } from 'react-i18next';
import { ExternalLink, Replace, X } from 'lucide-react';
import { useEditor, useSettings } from '../store';
import { StatusBadge, StockBadge } from '../ui';
import { formatPrice, formatValue } from '../units';
import type { VersionData } from '../types';

export function Inspector({ data }: { data?: VersionData }) {
  const { t, i18n } = useTranslation();
  const { selected, select } = useEditor();
  const level = useSettings((s) => s.level);
  if (!data) return null;
  const part = data.parts.find((p) => p.ref === selected);
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-3 border-b border-line-soft py-2 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-mono">{value}</dd>
    </div>
  );

  if (!part) {
    const cost = data.parts.reduce((sum, p) => sum + (p.price ?? 0) * p.qty, 0);
    const [w, h] = data.summary.board;
    return (
      <div className="p-4">
        <h2 className="mb-3 text-[15px]">{t('inspector.summary')}</h2>
        <dl className="text-[13px]">
          {row(t('inspector.power'), formatValue(data.summary.power, i18n.language))}
          {row(t('inspector.current'), formatValue(data.summary.current, i18n.language))}
          {row(t('inspector.cost'), formatPrice(cost, i18n.language))}
          {row(t('inspector.board'), t('inspector.boardSize', { w, h }))}
          {row(t('inspector.parts'), data.parts.reduce((n, p) => n + p.qty, 0))}
        </dl>
      </div>
    );
  }

  const checks = data.checks.filter((c) => c.partRefs.includes(part.ref));
  return (
    <div className="p-4">
      <div className="mb-3 flex items-start gap-2">
        <div className="flex-1">
          <h2 className="font-mono text-[15px]">{part.ref}</h2>
          <p className="font-mono text-[20px] font-semibold">{formatValue(part.value, i18n.language)}</p>
          <p className="text-muted">{part.package}</p>
        </div>
        <button className="icon-btn" onClick={() => select(undefined)} aria-label={t('inspector.close')}>
          <X size={16} />
        </button>
      </div>
      {part.explain && level !== 'engineer' && <p className="mb-3 rounded-xl bg-bg p-3 text-[13px] leading-relaxed">{part.explain[level]}</p>}
      <dl className="text-[13px]">
        {row(t('inspector.sku'), part.factorySku)}
        {row(t('inspector.stock'), <StockBadge part={part} showCount />)}
        {row(t('inspector.bin'), part.bin ?? '—')}
        {row(t('inspector.price'), part.price != null ? formatPrice(part.price, i18n.language) : '—')}
      </dl>
      {Object.keys(part.params).length > 0 && (
        <>
          <h3 className="mt-5 mb-1 text-[13px]">{t('inspector.params')}</h3>
          <dl className="text-[13px]">{Object.entries(part.params).map(([k, v]) => <div key={k}>{row(k, v)}</div>)}</dl>
        </>
      )}
      {checks.length > 0 && (
        <>
          <h3 className="mt-5 mb-2 text-[13px]">{t('inspector.inChecks')}</h3>
          <ul className="space-y-1.5 text-[13px]">
            {checks.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <StatusBadge status={c.status} label={c.title} />
                {c.value && (
                  <span className="font-mono text-[12px] text-muted">
                    {formatValue(c.value, i18n.language)}
                    {c.limit && ` / ${formatValue(c.limit, i18n.language)}`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-5 flex gap-2">
        {/* ponytail: replacement picker (GET /inventory/search) comes with stage 3. */}
        <button className="btn btn-secondary" disabled title={t('common.soon')}>
          <Replace size={14} />
          {t('inspector.replace')}
        </button>
        {part.datasheetUrl && (
          <a className="btn btn-secondary" href={part.datasheetUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            {t('inspector.datasheet')}
          </a>
        )}
      </div>
    </div>
  );
}
