import { motion } from "framer-motion";
import { BookOpen, Check, ChevronRight, Copy, Fingerprint, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Passport } from "@/lib/mock-data";
import { gradeColor } from "@/lib/mock-data";
import { VerificationBadge } from "./VerificationBadge";

const severityColor = ["", "#4f8a60", "#d28b22", "#b43f32"];

export function ConditionPassport({ p, compact = false }: { p: Passport; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copyHash = () => {
    navigator.clipboard?.writeText(p.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <motion.article
      layoutId={`passport-${p.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="overflow-hidden rounded-lg border-[6px] border-[#123f35] bg-[#123f35] shadow-xl"
      aria-label={`Condition Passport for ${p.itemName}`}
    >
      <header className="flex items-center justify-between gap-4 px-4 py-3 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full border border-white/40">
            <BookOpen className="size-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
              Relay Republic
            </div>
            <div className="text-sm font-semibold uppercase tracking-[0.12em]">
              Condition Passport
            </div>
          </div>
        </div>
        <div className="hidden text-right font-mono text-[10px] text-white/70 sm:block">
          <div>PASSPORT NO.</div>
          <div className="text-white">{p.id.toUpperCase()}</div>
        </div>
      </header>

      <div className="relative bg-[#f7f3e8] text-[#17221f]">
        <div className="absolute inset-y-0 left-1/2 hidden w-px bg-[#d6d0c0] shadow-[1px_0_3px_rgba(0,0,0,.16)] md:block" />
        <div className={`grid ${compact ? "md:grid-cols-[.9fr_1.1fr]" : "md:grid-cols-2"}`}>
          <section className="p-4 sm:p-6 md:pr-7">
            <div className="flex gap-4">
              <div className="relative h-32 w-28 shrink-0 overflow-hidden border border-[#c8c0ae] bg-white sm:h-40 sm:w-36">
                <img src={p.thumbnail} alt={p.itemName} className="h-full w-full object-cover" />
                {p.defects
                  .filter((defect) => defect.x != null && defect.y != null)
                  .map((defect, index) => (
                    <span
                      key={`${defect.label}-${index}`}
                      className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                      style={{
                        left: `${defect.x}%`,
                        top: `${defect.y}%`,
                        background: severityColor[defect.severity],
                      }}
                    />
                  ))}
              </div>
              <dl className="min-w-0 flex-1 space-y-3 text-xs">
                <div>
                  <dt className="text-[9px] font-semibold uppercase text-[#6b706d]">
                    Product name
                  </dt>
                  <dd className="mt-0.5 text-base font-semibold leading-tight">{p.itemName}</dd>
                </div>
                <div>
                  <dt className="text-[9px] font-semibold uppercase text-[#6b706d]">Category</dt>
                  <dd className="mt-0.5 capitalize">{p.category}</dd>
                </div>
                <div>
                  <dt className="text-[9px] font-semibold uppercase text-[#6b706d]">Packaging</dt>
                  <dd className="mt-0.5">{p.packaging}</dd>
                </div>
                <div>
                  <dt className="text-[9px] font-semibold uppercase text-[#6b706d]">
                    Unit identity
                  </dt>
                  <dd className="mt-0.5 break-all font-mono text-[10px]">{p.unitId}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-5 border-t border-[#d6d0c0] pt-4">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-[#53605b]">
                <Fingerprint className="size-4 text-[#123f35]" /> Verified identity
              </div>
              <div className="mt-2 font-mono text-[10px] leading-relaxed text-[#4c5652]">
                RLY&lt;{p.category.slice(0, 3).toUpperCase()}&lt;
                {p.unitId.replace(/-/g, "").slice(-14).toUpperCase()}&lt;&lt;
                <br />
                {p.hash.replace(/^0x/, "").slice(0, 34).toUpperCase()}
              </div>
            </div>
          </section>

          <section className="border-t border-[#d6d0c0] p-4 sm:p-6 md:border-l-0 md:border-t-0 md:pl-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[9px] font-semibold uppercase text-[#6b706d]">
                  AI condition grade
                </div>
                <div className="mt-1 text-xs text-[#53605b]">Confidence {p.confidence}%</div>
              </div>
              <div
                className="flex size-20 rotate-[-5deg] items-center justify-center rounded-full border-[3px] text-3xl font-bold"
                style={{ color: gradeColor[p.grade], borderColor: gradeColor[p.grade] }}
                aria-label={`Grade ${p.grade}`}
              >
                {p.grade}
              </div>
            </div>

            <div className="mt-4 border-y border-[#d6d0c0] py-4">
              <div className="text-[9px] font-semibold uppercase text-[#6b706d]">
                Condition description
              </div>
              <p className="mt-1 text-sm leading-relaxed">{p.graderNote}</p>
            </div>

            <div className="mt-4">
              <div className="text-[9px] font-semibold uppercase text-[#6b706d]">
                Inspection findings
              </div>
              {p.defects.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {p.defects.map((defect, index) => (
                    <li
                      key={`${defect.label}-${index}`}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ background: severityColor[defect.severity] }}
                      />
                      {defect.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-[#176b4a]">
                  <Check className="size-4" /> No defects detected
                </div>
              )}
            </div>

            {p.verification && <VerificationBadge verification={p.verification} className="mt-4" />}
          </section>
        </div>

        <footer className="flex flex-col gap-3 border-t border-[#c8c0ae] bg-[#ece7da] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={copyHash}
            className="inline-flex min-w-0 items-center gap-2 text-left font-mono text-[10px] hover:text-[#123f35]"
            title="Copy passport hash"
          >
            <span className="shrink-0 text-[#6b706d]">HASH</span>
            <span className="truncate">{p.hash}</span>
            {copied ? <Check className="size-3 shrink-0" /> : <Copy className="size-3 shrink-0" />}
          </button>
          <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase text-[#176b4a]">
            <ShieldCheck className="size-4" /> Verified on LifeLedger
          </div>
        </footer>
      </div>

      {!compact && (
        <Link
          to="/ledger/$unitId"
          params={{ unitId: p.unitId }}
          className="flex items-center justify-center gap-1 bg-[#123f35] px-5 py-3 text-sm font-medium text-white hover:bg-[#0d3028]"
        >
          Open immutable product history <ChevronRight className="size-4" />
        </Link>
      )}
    </motion.article>
  );
}
