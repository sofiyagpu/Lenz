import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Download, Wrench } from 'lucide-react';
import { useEditor, useSettings } from '../store';
import { StatusBadge, StockBadge, stockState } from '../ui';
import { formatPrice, formatValue } from '../units';
import type { CheckResult, Level, VersionData } from '../types';

export type Tab = 'schematic' | 'breadboard' | 'pcb' | 'enclosure' | 'checks' | 'bom' | 'firmware';

export const tabsFor = (level: Level): Tab[] =>
  level === 'zero' ? ['breadboard', 'schematic', 'enclosure'] : ['schematic', 'breadboard', 'pcb', 'enclosure', 'checks', 'bom', 'firmware'];

export function Canvas({ tab, data, onFix }: { tab: Tab; data: VersionData; onFix: (text: string) => void }) {
  const { t } = useTranslation();
  if (tab === 'bom') return <Bom data={data} />;
  if (tab === 'checks') return <Checks checks={data.checks} onFix={onFix} />;
  // ponytail: schematic/breadboard/pcb/enclosure/firmware views land in stages 3–6.
  return (
    <div className="grid h-full place-items-center p-8 text-center text-muted">
      <p>{t('ws.soon')}</p>
    </div>
  );
}

function Bom({ data }: { data: VersionData }) {
  const { t, i18n } = useTranslation();
  const { selected, select } = useEditor();
  const [onlyMissing, setOnlyMissing] = useState(false);
  const parts = onlyMissing ? data.parts.filter((p) => stockState(p) === 'out') : data.parts;
  const csv = () => {
    const rows = [
      ['ref', 'value', 'package', 'qty', 'factorySku', 'stock', 'bin', 'price'],
      ...data.parts.map((p) => [p.ref, p.value, p.package, p.qty, p.factorySku, p.stock, p.bin ?? '', p.price ?? '']),
    ];
    const body = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' }));
    a.download = 'bom.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="p-3 md:p-4">
      <div className="mb-3 flex items-center gap-2">
        <label className="chip cursor-pointer">
          <input type="checkbox" className="accent-[var(--accent)]" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
          {t('bom.onlyMissing')}
        </label>
        <button className="chip ml-auto" onClick={csv}>
          <Download size={13} />
          {t('bom.csv')}
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line-soft bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-line-soft text-[12px] text-muted">
            <tr>
              {(['ref', 'value', 'package', 'qty', 'stock', 'bin', 'price'] as const).map((k) => (
                <th key={k} className="px-3 py-2 font-semibold whitespace-nowrap">
                  {t(`bom.${k}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr
                key={p.ref}
                tabIndex={0}
                aria-selected={selected === p.ref}
                onClick={() => select(p.ref)}
                onKeyDown={(e) => e.key === 'Enter' && select(p.ref)}
                className={clsx('cursor-pointer border-b border-line-soft last:border-0 hover:bg-bg', selected === p.ref && '!bg-accent-soft')}
              >
                <td className="px-3 py-2 font-mono font-semibold">{p.ref}</td>
                <td className="px-3 py-2 font-mono whitespace-nowrap">{formatValue(p.value, i18n.language)}</td>
                <td className="px-3 py-2 text-muted">{p.package}</td>
                <td className="px-3 py-2 font-mono">{p.qty}</td>
                <td className="px-3 py-2">
                  <StockBadge part={p} showCount />
                </td>
                <td className="px-3 py-2 font-mono text-muted">{p.bin ?? '—'}</td>
                <td className="px-3 py-2 font-mono whitespace-nowrap">{p.price != null ? formatPrice(p.price * p.qty, i18n.language) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Checks({ checks, onFix }: { checks: CheckResult[]; onFix: (text: string) => void }) {
  const { t, i18n } = useTranslation();
  const level = useSettings((s) => s.level);
  const { selected, select } = useEditor();
  const failing = checks.find((c) => c.status === 'fail') ?? checks.find((c) => c.status === 'warn');

  if (level === 'zero')
    return (
      <div className="p-4">
        <div className={clsx('flex items-center gap-3 rounded-xl p-4', failing ? 'bg-fail-soft' : 'bg-pass-soft')}>
          <StatusBadge status={failing ? 'fail' : 'pass'} label={failing ? t('checks.problem', { title: failing.title }) : t('checks.safe')} />
          {failing && <p className="flex-1 text-[13px]">{failing.explain.zero}</p>}
        </div>
      </div>
    );

  const layers = [...new Set(checks.map((c) => c.layer))];
  return (
    <div className="space-y-6 p-3 md:p-4">
      {layers.map((layer) => (
        <section key={layer}>
          <h3 className="mb-2 text-[12px] font-semibold tracking-wide text-muted uppercase">{t(`checks.layers.${layer}`)}</h3>
          <div className="space-y-2">
            {checks
              .filter((c) => c.layer === layer)
              .map((c) => (
                <article key={c.id} className="card flex flex-wrap items-start gap-x-3 gap-y-2 p-3">
                  <StatusBadge status={c.status} />
                  <div className="min-w-[200px] flex-1">
                    <h4 className="font-semibold">
                      {c.title}
                      {c.value && (
                        <span className="ml-2 font-mono text-[12px] font-normal text-muted">
                          {formatValue(c.value, i18n.language)}
                          {c.limit && ` · ${t('checks.limit', { limit: formatValue(c.limit, i18n.language) })}`}
                        </span>
                      )}
                    </h4>
                    {level === 'hobby' && <p className="mt-1 text-[13px] text-muted">{c.explain.hobby}</p>}
                    {level === 'engineer' && <p className="mt-1 font-mono text-[12px] text-muted">{c.explain.engineer}</p>}
                    {c.partRefs.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.partRefs.map((ref) => (
                          <button
                            key={ref}
                            onClick={() => select(ref)}
                            className={clsx('rounded-md border px-1.5 font-mono text-[11px]', selected === ref ? 'border-accent bg-accent-soft' : 'border-line')}
                          >
                            {ref}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {(c.status === 'fail' || c.status === 'warn') && (
                    <button className="btn btn-secondary min-h-8 px-3" onClick={() => onFix(c.fixHint ?? t('checks.fixPrompt', { title: c.title }))}>
                      <Wrench size={13} />
                      {t('checks.fix')}
                    </button>
                  )}
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
