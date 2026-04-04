import { SiteHeader } from "@/components/site/site-header";
import { BrandWordmark } from "@/components/site/brand-wordmark";
import { LogoLockup } from "@/components/site/logo-lockup";
import { BrandMark, logoOptions } from "@/components/site/logo-system";
import { brand } from "@/lib/site/brand";

export const dynamic = "force-dynamic";

export default function LogoLabPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell page-shell">
        <section className="max-w-4xl">
          <div className="eyebrow">Brand system</div>
          <h1 className="mt-5 text-5xl leading-[0.94] text-ink sm:text-6xl">{brand.name}, now led by the wordmark alone.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-ink/64">
            The live product now uses the {brand.identity.wordmarkFont} wordmark on its own, with {brand.identity.uiFont}
            for interface copy. This page keeps the current text-first direction visible while preserving older symbol
            explorations for reference.
          </p>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          <article className="card p-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink/42">Primary wordmark</div>
            <div className="mt-6 rounded-[24px] border border-line/70 bg-paper/70 p-5">
              <LogoLockup href="/logo-lab" />
            </div>
            <div className="mt-5 text-lg tracking-[-0.03em] text-ink/88">Used in the live header</div>
            <p className="mt-2 text-sm leading-7 text-ink/58">
              The live brand now uses the text wordmark alone, with tighter spacing and no separate icon competing with it.
            </p>
          </article>

          <article className="card p-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink/42">Archived symbol</div>
            <div className="mt-6 flex min-h-[156px] items-center justify-center rounded-[24px] border border-line/70 bg-paper/70">
              <BrandMark variant={brand.identity.primaryVariant} className="h-20 w-20 rounded-[24px]" />
            </div>
            <div className="mt-5 text-lg tracking-[-0.03em] text-ink/88">{brand.identity.primaryMark}</div>
            <p className="mt-2 text-sm leading-7 text-ink/58">
              Kept here only as a retired exploration, not as part of the live brand lockup.
            </p>
          </article>

          <article className="card p-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink/42">Type system</div>
            <div className="mt-6 rounded-[24px] border border-line/70 bg-paper/70 p-5">
              <BrandWordmark className="text-4xl text-ink/92" />
              <div className="mt-2 text-sm text-ink/58">Wordmark: {brand.identity.wordmarkFont}</div>
              <div className="mt-1 text-sm text-ink/58">UI copy: {brand.identity.uiFont}</div>
            </div>
            <div className="mt-5 text-lg tracking-[-0.03em] text-ink/88">Editorial wordmark</div>
            <p className="mt-2 text-sm leading-7 text-ink/58">
              The brand name now carries a warmer serif voice of its own, while the rest of the interface stays in San
              Francisco.
            </p>
          </article>
        </section>

        <section className="mt-10">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink/42">Alternate directions</div>
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {logoOptions.map((option) => (
            <article key={option.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <BrandMark variant={option.id} className="h-14 w-14" />
                <div className="rounded-full border border-line/70 bg-paper/76 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-ink/46">
                  Option {option.id}
                </div>
              </div>
              <div className="mt-5">
                <BrandWordmark className="text-2xl text-ink/92" />
                {brand.descriptor ? (
                  <div className="brand-tagline mt-1 text-[10px] uppercase text-ink/42">{brand.descriptor}</div>
                ) : null}
              </div>
              <div className="mt-5 text-lg tracking-[-0.03em] text-ink/88">{option.name}</div>
              <p className="mt-2 text-sm leading-7 text-ink/58">{option.note}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
