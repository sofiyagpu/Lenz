import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { LoaderCircle, Settings } from 'lucide-react';
import { api } from '../api';
import { PromptBox } from '../prompt-box';
import { LangToggle, Logo, ThemeToggle } from '../ui';
import type { Project } from '../types';

export default function Home() {
  const { t, i18n } = useTranslation();
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => api<Project[]>('/projects') });
  return (
    <div className="min-h-svh">
      <header className="flex h-16 items-center gap-2 px-4 md:px-12">
        <Logo to="/app" />
        <div className="ml-auto flex items-center gap-1">
          <LangToggle />
          <ThemeToggle />
          <Link to="/settings" className="icon-btn" aria-label={t('common.settings')}>
            <Settings size={16} />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 pb-16">
        <section className="mx-auto mt-8 mb-14 max-w-[760px] text-center">
          <h1 className="mb-6 text-[clamp(30px,4vw,44px)] font-medium tracking-[-0.04em]">{t('home.title')}</h1>
          <PromptBox autoFocus />
        </section>
        <h2 className="mb-4 border-b border-line pb-3 text-[15px]">{t('home.projects')}</h2>
        {!projects ? (
          <LoaderCircle className="mx-auto animate-spin text-faint" />
        ) : projects.length === 0 ? (
          <p className="text-muted">{t('home.empty')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} to={`/p/${p.id}`} className="card p-5 transition-shadow hover:shadow-md">
                <strong className="block text-[15px]">{p.title}</strong>
                <span className="mt-1 block text-sm text-muted">
                  {p.version ? t('home.version', { v: p.version }) : t('home.draft')} ·{' '}
                  {new Date(p.updatedAt).toLocaleDateString(i18n.language)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
