import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import clsx from 'clsx';
import { Check, Cpu, GraduationCap, Wrench } from 'lucide-react';
import { useSettings, type Source, type Tool } from '../store';
import { useStartProject } from '../ui';
import { Logo } from '../ui';
import type { Level } from '../types';

const levels: [Level, typeof Cpu][] = [
  ['zero', GraduationCap],
  ['hobby', Wrench],
  ['engineer', Cpu],
];
export const allTools: Tool[] = ['breadboard', 'multimeter', 'solder', 'printer', 'psu'];
export const allSources: Source[] = ['factory', 'kit', 'buy'];

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const settings = useSettings();
  const { start, busy } = useStartProject();
  const [step, setStep] = useState(0);

  const finish = () => {
    settings.set({ onboarded: true });
    const prompt = useSettings.getState().pendingPrompt;
    if (prompt) void start(prompt);
    else navigate('/app');
  };
  const next = () => (step < 2 ? setStep(step + 1) : finish());
  const toggleTool = (tool: Tool) =>
    settings.set({ tools: settings.tools.includes(tool) ? settings.tools.filter((x) => x !== tool) : [...settings.tools, tool] });

  const option = (selected: boolean) =>
    clsx(
      'card flex w-full items-center gap-4 p-5 text-left transition-shadow hover:shadow-md',
      selected && 'ring-2 ring-accent',
    );

  return (
    <div className="flex min-h-svh flex-col bg-surface">
      <header className="flex h-16 items-center px-4 md:px-12">
        <Logo />
        <span className="ml-auto text-sm text-muted">{t('onboarding.step', { n: step + 1 })}</span>
      </header>
      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col px-4 py-8">
        {step === 0 && (
          <fieldset className="grid gap-3">
            <legend className="mb-6 text-[28px] font-medium tracking-[-0.03em]">{t('onboarding.levelTitle')}</legend>
            {levels.map(([level, Icon]) => (
              <button key={level} className={option(settings.level === level)} aria-pressed={settings.level === level} onClick={() => settings.set({ level })}>
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-text">
                  <Icon size={22} />
                </span>
                <span>
                  <strong className="block text-[16px]">{t(`level.${level}`)}</strong>
                  <span className="block text-sm text-muted">{t(`level.${level}Hint`)}</span>
                  <span className="mt-1 block text-sm text-faint">{t(`level.${level}Example`)}</span>
                </span>
              </button>
            ))}
          </fieldset>
        )}
        {step === 1 && (
          <fieldset className="grid gap-3">
            <legend className="mb-2 text-[28px] font-medium tracking-[-0.03em]">{t('onboarding.toolsTitle')}</legend>
            <p className="mb-4 text-muted">{t('onboarding.toolsHint')}</p>
            {allTools.map((tool) => {
              const on = settings.tools.includes(tool);
              return (
                <button key={tool} className={option(on)} aria-pressed={on} onClick={() => toggleTool(tool)}>
                  <span className={clsx('grid size-6 place-items-center rounded-md border', on ? 'border-accent bg-accent text-on-primary' : 'border-line')}>
                    {on && <Check size={14} />}
                  </span>
                  <strong className="text-[15px]">{t(`tools.${tool}`)}</strong>
                </button>
              );
            })}
          </fieldset>
        )}
        {step === 2 && (
          <fieldset className="grid gap-3">
            <legend className="mb-6 text-[28px] font-medium tracking-[-0.03em]">{t('onboarding.sourceTitle')}</legend>
            {allSources.map((source) => (
              <button key={source} className={option(settings.source === source)} aria-pressed={settings.source === source} onClick={() => settings.set({ source })}>
                <strong className="text-[15px]">{t(`source.${source}`)}</strong>
              </button>
            ))}
          </fieldset>
        )}
        <div className="mt-auto flex items-center gap-3 pt-10">
          {step > 0 && (
            <button className="btn btn-secondary btn-large" onClick={() => setStep(step - 1)}>
              {t('common.back')}
            </button>
          )}
          <button
            className="ml-auto text-sm font-semibold text-muted hover:text-text"
            onClick={() => {
              if (step === 0) settings.set({ level: 'hobby' });
              next();
            }}
          >
            {t('common.skip')}
          </button>
          <button className="btn btn-primary btn-large" onClick={next} disabled={busy}>
            {step < 2 ? t('common.next') : t('onboarding.finish')}
          </button>
        </div>
      </main>
    </div>
  );
}
