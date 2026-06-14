import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, ShieldAlert, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Fingerprint } from "@/components/relay/Fingerprint";
import { verifyLedger } from "@/lib/relay-api";

export const Route = createFileRoute("/ledger/$unitId")({
  component: LedgerPage,
});

function CopyHash({ hash }: { hash: string | null | undefined }) {
  const [copied, setCopied] = useState(false);
  if (!hash) return null;
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors mt-1"
    >
      {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
      {hash.slice(0, 10)}…{hash.slice(-6)}
    </button>
  );
}

function LedgerPage() {
  const { unitId } = Route.useParams();
  const { data: verify, isLoading, isError } = useQuery({
    queryKey: ["ledger", unitId],
    queryFn: () => verifyLedger(unitId),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center text-muted-foreground">
        Loading on-chain record…
      </div>
    );
  }

  if (isError || !verify) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground">Could not load ledger for this unit.</p>
        <Link to="/" className="text-primary text-sm mt-4 inline-block hover:underline">
          ← Back home
        </Link>
      </div>
    );
  }

  const displayHash =
    verify.passport_hash ?? verify.on_chain_hash ?? unitId.replace(/-/g, "");
  const hasOnChainProof = Boolean(verify.passport_hash && verify.on_chain_hash);
  const statusLabel = verify.verified
    ? "Verified on-chain"
    : hasOnChainProof
      ? "Hash mismatch — possible tamper"
      : verify.events.length > 0
        ? "Event history on file"
        : "No passport graded yet";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          LifeLedger · On-Chain Passport
        </div>
        <h1 className="font-display text-3xl mt-2">Unit {unitId.slice(0, 8)}…</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-soft p-6 mt-8"
      >
        <div className="flex items-start gap-5">
          <Fingerprint hash={displayHash} />
          <div className="flex-1 min-w-0">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                verify.verified
                  ? "bg-primary/10 text-primary"
                  : hasOnChainProof
                    ? "bg-destructive/10 text-destructive"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {verify.verified ? (
                <ShieldCheck className="size-3.5" />
              ) : hasOnChainProof ? (
                <ShieldAlert className="size-3.5" />
              ) : (
                <Shield className="size-3.5" />
              )}
              {statusLabel}
            </div>
            <div className="mt-4 space-y-2">
              {verify.passport_hash && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Passport hash (recomputed)
                  </div>
                  <CopyHash hash={verify.passport_hash} />
                </div>
              )}
              {verify.on_chain_hash && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    On-chain hash
                  </div>
                  <CopyHash hash={verify.on_chain_hash} />
                </div>
              )}
              {verify.tx_hash && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Anchor tx
                  </div>
                  <CopyHash hash={verify.tx_hash} />
                </div>
              )}
              {!verify.passport_hash && verify.events.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  This unit has LifeLedger events but no condition passport has been graded yet.
                  On-chain verification will activate after grading.
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-10">
        <h2 className="font-display text-lg mb-4">Event timeline</h2>
        {verify.events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events recorded for this unit yet.</p>
        ) : (
          <div className="relative pl-6 space-y-0">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            {verify.events.map((e, i) => (
              <motion.div
                key={`${e.event_type}-${e.created_at ?? i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="relative pb-6"
              >
                <div className="absolute -left-6 top-1.5 size-3.5 rounded-full border-2 border-primary bg-background" />
                <div className="text-sm font-medium">{e.event_type.replace(/_/g, " ")}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {e.created_at ? new Date(e.created_at).toLocaleString() : "—"}
                </div>
                {e.tx_hash && <CopyHash hash={e.tx_hash} />}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          to="/rescue"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="size-3.5" /> View rescue listings
        </Link>
      </div>
    </div>
  );
}
