import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ArrowRight, Cpu, Factory, GraduationCap, Wrench } from 'lucide-react';
import { HeroParticles, TypedHeading } from '../particles';
import { PromptBox } from '../prompt-box';
import { LangToggle, Logo, ThemeToggle } from '../ui';

const levelIcons = { zero: GraduationCap, hobby: Wrench, engineer: Cpu };

export default function Landing() {
  const { t } = useTranslation();
  const how = t('landing.how', { returnObjects: true }) as [string, string][];
  const faq = t('landing.faq', { returnObjects: true }) as [string, string][];
  return (
    <div className="landing min-h-screen bg-surface">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-6 px-4 backdrop-blur-md md:px-12 bg-surface/85">
        <Logo />
        <nav className="hidden gap-1 md:flex" aria-label={t('landing.nav.how')}>
          {(['how', 'levels', 'factories', 'faq'] as const).map((k) => (
            <a key={k} href={`#${k}`} className="rounded-full px-4 py-1.5 text-[14.5px] font-medium text-muted hover:bg-raised hover:text-text">
              {t(`landing.nav.${k}`)}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <LangToggle />
          <ThemeToggle />
          <Link className="btn btn-primary ml-2" to="/app">
            {t('landing.signIn')}
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main>
        <section className="relative isolate grid min-h-[calc(100svh-64px)] place-items-center overflow-hidden" aria-labelledby="hero-title">
          <HeroParticles />
          <div className="w-full max-w-[760px] px-4 pb-20 text-center">
            <TypedHeading
              id="hero-title"
              text={t('landing.headline')}
              className="text-[clamp(30px,4.6vw,60px)] leading-[1.08] font-medium tracking-[-0.045em] text-balance"
            />
            <p className="rise mx-auto mt-5 max-w-[560px] text-[16px] leading-relaxed text-muted" style={{ '--delay': '0.6s' } as React.CSSProperties}>
              {t('landing.sub')}
            </p>
            <div className="rise mt-8" style={{ '--delay': '0.8s' } as React.CSSProperties}>
              <PromptBox />
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-16 px-4 py-24 md:px-12">
          <h2 data-reveal className="mb-12 text-center text-[clamp(30px,4vw,48px)] font-medium tracking-[-0.04em]">
            {t('landing.howTitle')}
          </h2>
          <ol className="mx-auto grid max-w-[1100px] gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {how.map(([title, text], i) => (
              <li key={title} data-reveal className="rounded-[28px] bg-bg p-6" style={{ transitionDelay: `${i * 80}ms` }}>
                <span className="font-mono text-xs text-faint">0{i + 1}</span>
                <h3 className="mt-3 text-lg">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="levels" className="scroll-mt-16 px-4 py-24 md:px-12">
          <h2 data-reveal className="mb-12 text-center text-[clamp(30px,4vw,48px)] font-medium tracking-[-0.04em]">
            {t('landing.levelsTitle')}
          </h2>
          <div className="mx-auto grid max-w-[1100px] gap-4 md:grid-cols-3">
            {(['zero', 'hobby', 'engineer'] as const).map((level) => {
              const Icon = levelIcons[level];
              return (
                <div key={level} data-reveal className="card p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent-text">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 text-lg">{t(`level.${level}`)}</h3>
                  <p className="text-sm text-faint">{t(`level.${level}Hint`)}</p>
                  <p className="mt-3 leading-relaxed text-muted">{t(`level.${level}Example`)}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="factories" className="scroll-mt-16 px-4 py-24 md:px-12">
          <div data-reveal className="mx-auto flex max-w-[1100px] flex-col items-start gap-6 rounded-[36px] bg-bg p-8 md:flex-row md:items-center md:p-12">
            <Factory size={40} className="shrink-0 text-accent" aria-hidden />
            <div className="flex-1">
              <h2 className="text-[28px] font-medium tracking-[-0.03em]">{t('landing.factoryTitle')}</h2>
              <p className="mt-2 max-w-[620px] leading-relaxed text-muted">{t('landing.factoryText')}</p>
            </div>
            <a className="btn btn-primary btn-large" href="mailto:hello@lenz.dev">
              {t('landing.factoryCta')}
            </a>
          </div>
        </section>

        <section id="faq" className="scroll-mt-16 px-4 py-24 md:px-12">
          <h2 data-reveal className="mb-10 text-center text-[clamp(30px,4vw,48px)] font-medium tracking-[-0.04em]">
            {t('landing.faqTitle')}
          </h2>
          <div className="mx-auto max-w-[760px] divide-y divide-line-soft">
            {faq.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="cursor-pointer list-none text-[16px] font-semibold marker:hidden">
                  <span className="mr-2 inline-block text-faint transition-transform group-open:rotate-45">+</span>
                  {q}
                </summary>
                <p className="mt-3 pl-6 leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-4 border-t border-line-soft px-4 py-8 sm:flex-row sm:items-center sm:justify-between md:px-12">
        <Logo />
        <span className="text-muted">{t('landing.footer')}</span>
      </footer>
    </div>
  );
}
