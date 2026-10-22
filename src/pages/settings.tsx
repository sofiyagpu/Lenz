import { useTranslation } from 'react-i18next';
import { useSettings } from '../store';
import { LangToggle, Logo, ThemeToggle } from '../ui';
import { allSources, allTools } from './onboarding';

export default function SettingsPage() {
  const { t } = useTranslation();
  const s = useSettings();
  return (
    <div className="min-h-svh">
      <header className="flex h-16 items-center gap-2 px-4 md:px-12">
        <Logo to="/app" />
        <div className="ml-auto flex items-center gap-1">
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto grid max-w-[640px] gap-8 px-4 py-8">
        <h1 className="text-[28px] font-medium tracking-[-0.03em]">{t('settings.title')}</h1>
        <section>
          <h2 className="mb-3 text-[15px]">{t('settings.level')}</h2>
          <div className="segmented">
            {(['zero', 'hobby', 'engineer'] as const).map((level) => (
              <button key={level} aria-pressed={s.level === level} onClick={() => s.set({ level })}>
                {t(`level.${level}`)}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-[15px]">{t('settings.tools')}</h2>
          <div className="grid gap-2">
            {allTools.map((tool) => (
              <label key={tool} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--accent)]"
                  checked={s.tools.includes(tool)}
                  onChange={(e) => s.set({ tools: e.target.checked ? [...s.tools, tool] : s.tools.filter((x) => x !== tool) })}
                />
                {t(`tools.${tool}`)}
              </label>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-[15px]">{t('settings.source')}</h2>
          <div className="grid gap-2">
            {allSources.map((source) => (
              <label key={source} className="flex items-center gap-3">
                <input type="radio" name="source" className="size-4 accent-[var(--accent)]" checked={s.source === source} onChange={() => s.set({ source })} />
                {t(`source.${source}`)}
              </label>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
