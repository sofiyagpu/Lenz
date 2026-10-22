import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';
import clsx from 'clsx';
import { ChevronLeft, CircleCheck, CircleX, Cpu, Download, LoaderCircle, MessageSquare, PanelRightClose, PanelRightOpen, Share2, Package, TriangleAlert, LayoutGrid } from 'lucide-react';
import { api } from '../api';
import { useEditor, useSettings } from '../store';
import { stockState, ThemeToggle, useMedia } from '../ui';
import type { Project, VersionData } from '../types';
import { useAgent } from './agent';
import { Canvas, tabsFor, type Tab } from './canvas';
import { Chat } from './chat';
import { Inspector } from './inspector';

export default function Workspace() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { level, set } = useSettings();
  const { viewVersion, setViewVersion, selected, select } = useEditor();
  const agent = useAgent(id);
  const mobile = useMedia('(max-width: 767px)');
  const [mobileTab, setMobileTab] = useState<'chat' | 'result' | 'part'>('chat');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    select(undefined);
    setViewVersion(undefined);
  }, [id, select, setViewVersion]);

  const project = useQuery({ queryKey: ['project', id], queryFn: () => api<Project>(`/projects/${id}`), retry: false });
  const shown = viewVersion ?? agent.version;
  // The previous version stays on screen until the next one has fully loaded.
  const { data } = useQuery({
    queryKey: ['version', id, shown],
    queryFn: () => api<VersionData>(`/projects/${id}/versions/${shown}`),
    enabled: shown > 0,
    placeholderData: keepPreviousData,
  });

  const tabs = tabsFor(level);
  const tab = tabs.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : tabs[0];
  const layout = useDefaultLayout({ id: 'lenz-workspace', storage: localStorage, panelIds: inspectorOpen ? ['chat', 'canvas', 'inspector'] : ['chat', 'canvas'] });

  if (project.isError)
    return (
      <div className="grid min-h-svh place-items-center text-muted">
        <Link to="/app" className="btn btn-secondary">
          <ChevronLeft size={16} />
          {t('common.notFound')}
        </Link>
      </div>
    );

  const missing = data?.parts.filter((p) => stockState(p) === 'out').length ?? 0;
  const c = agent.checks;
  const checksBadge = !c ? (
    <span className="flex items-center gap-1.5 text-muted">{t('ws.checks.none')}</span>
  ) : c.fail ? (
    <span className="flex items-center gap-1.5 rounded-full bg-fail-soft px-2.5 py-1 text-fail"><CircleX size={14} />{t('ws.checks.fail', { count: c.fail })}</span>
  ) : c.warn ? (
    <span className="flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 text-warn"><TriangleAlert size={14} />{t('ws.checks.warn', { count: c.warn })}</span>
  ) : (
    <span className="flex items-center gap-1.5 rounded-full bg-pass-soft px-2.5 py-1 text-pass"><CircleCheck size={14} />{t('ws.checks.pass')}</span>
  );
  const stockBadge = data && (
    <span className={clsx('flex items-center gap-1.5 rounded-full px-2.5 py-1', missing ? 'bg-fail-soft text-fail' : 'bg-pass-soft text-pass')}>
      <Package size={14} />
      {missing ? t('ws.stock.missing', { count: missing }) : t('ws.stock.ok')}
    </span>
  );

  const share = async () => {
    await navigator.clipboard.writeText(location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const topbar = (
    <header className="flex h-13 shrink-0 items-center gap-2 border-b border-line bg-surface px-2 text-[12px] font-semibold md:gap-3 md:px-3">
      <Link to="/app" className="icon-btn" aria-label="Lenz">
        <img src="/favicon.svg" alt="" width={22} height={22} />
      </Link>
      <div className="min-w-0">
        <h1 className="truncate text-[14px]">{project.data?.title ?? '…'}</h1>
        {shown > 0 && <span className="font-mono text-[11px] font-normal text-faint">v{shown}</span>}
      </div>
      <div className="segmented ml-2 hidden lg:inline-flex" role="group" aria-label={t('settings.level')}>
        {(['zero', 'hobby', 'engineer'] as const).map((l) => (
          <button key={l} aria-pressed={level === l} onClick={() => set({ level: l })}>
            {t(`level.${l}`)}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {checksBadge}
        <span className="hidden sm:flex">{stockBadge}</span>
      </div>
      <div className="hidden items-center gap-1.5 md:flex">
        {/* ponytail: export dialog and PCB order arrive in stage 7. */}
        <button className="btn btn-secondary min-h-8 px-3" disabled title={t('common.soon')}>
          <Download size={14} />
          {t('ws.export')}
        </button>
        <button className="btn btn-secondary min-h-8 px-3" disabled title={t('common.soon')}>
          <Cpu size={14} />
          {t('ws.order')}
        </button>
        <button className="btn btn-primary min-h-8 px-3" onClick={() => void share()}>
          <Share2 size={14} />
          {copied ? t('ws.copied') : t('ws.share')}
        </button>
        <ThemeToggle />
      </div>
    </header>
  );

  const canvas = (
    <div className="flex h-full flex-col bg-bg">
      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-surface px-2" role="tablist">
        {tabs.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setParams({ tab: k }, { replace: true })}
            className={clsx('-mb-px border-b-2 px-3 py-2.5 font-semibold whitespace-nowrap', tab === k ? 'border-accent text-text' : 'border-transparent text-muted hover:text-text')}
          >
            {t(`ws.tabs.${level === 'zero' && k === 'breadboard' ? 'build' : k}`)}
          </button>
        ))}
        {!mobile && (
          <button
            className="icon-btn my-auto ml-auto shrink-0"
            onClick={() => setInspectorOpen(!inspectorOpen)}
            aria-label={t(inspectorOpen ? 'inspector.collapse' : 'inspector.expand')}
            aria-expanded={inspectorOpen}
          >
            {inspectorOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        )}
      </nav>
      {viewVersion && (
        <div className="flex items-center gap-3 bg-warn-soft px-3 py-1.5 text-[12px] text-warn">
          {t('ws.viewing', { v: viewVersion })}
          <button className="font-semibold underline" onClick={() => setViewVersion(undefined)}>
            {t('ws.toLatest')}
          </button>
        </div>
      )}
      <div className="relative flex-1 overflow-auto">
        {agent.running && data && (
          <span className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[12px] font-semibold shadow-md">
            <LoaderCircle size={13} className="animate-spin" />
            {t('ws.updating')}
          </span>
        )}
        {data ? (
          <div key={data.version} className="fade-in h-full">
            <Canvas tab={tab} data={data} onFix={(text) => void agent.send(text)} />
          </div>
        ) : (
          <div className="grid h-full place-items-center text-muted">
            <span className="flex items-center gap-2">
              <LoaderCircle size={16} className="animate-spin" />
              {t('ws.building')}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const inspector = (
    <div className="h-full overflow-y-auto bg-surface">
      <Inspector data={data} />
    </div>
  );

  if (mobile)
    return (
      <div className="flex h-svh flex-col">
        {topbar}
        <main className="min-h-0 flex-1">
          {mobileTab === 'chat' && <Chat items={agent.items} send={agent.send} />}
          {mobileTab === 'result' && canvas}
          {mobileTab === 'part' && inspector}
        </main>
        <nav className="grid shrink-0 grid-cols-3 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
          {([
            ['chat', MessageSquare],
            ['result', LayoutGrid],
            ['part', Package],
          ] as const).map(([k, Icon]) => (
            <button
              key={k}
              aria-pressed={mobileTab === k}
              onClick={() => setMobileTab(k)}
              className={clsx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold', mobileTab === k ? 'text-text' : 'text-faint')}
            >
              <Icon size={20} />
              {t(`ws.mobile.${k}`)}
              {k === 'part' && selected && <span className="sr-only">{selected}</span>}
            </button>
          ))}
        </nav>
      </div>
    );

  return (
    <div className="flex h-svh flex-col">
      {topbar}
      <Group orientation="horizontal" className="min-h-0 flex-1" defaultLayout={layout.defaultLayout} onLayoutChanged={layout.onLayoutChanged}>
        <Panel id="chat" defaultSize={360} minSize={280} maxSize={560}>
          <Chat items={agent.items} send={agent.send} />
        </Panel>
        <Separator className="w-px bg-line transition-colors hover:bg-accent data-[separator=active]:bg-accent" />
        <Panel id="canvas" minSize={360}>
          {canvas}
        </Panel>
        {inspectorOpen && (
          <>
            <Separator className="w-px bg-line transition-colors hover:bg-accent" />
            <Panel id="inspector" defaultSize={320} minSize={260} maxSize={480}>
              {inspector}
            </Panel>
          </>
        )}
      </Group>
    </div>
  );
}
