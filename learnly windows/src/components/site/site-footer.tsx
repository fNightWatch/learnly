import { brand } from "@/lib/site/brand";

export function SiteFooter() {
  return (
    <footer className="shell pb-10 pt-8">
      <div className="flex flex-col gap-4 border-t border-line/70 px-1 py-5 text-sm text-ink/56 md:flex-row md:items-center md:justify-between">
        <p>{brand.promise}</p>
        <p>One clear dashboard, one studied-words ledger, and one focused study mode.</p>
      </div>
    </footer>
  );
}
