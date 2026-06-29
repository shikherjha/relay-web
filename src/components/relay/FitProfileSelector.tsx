import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Loader2, Plus, UserRound } from "lucide-react";
import {
  getFitProfiles,
  setActiveFitProfile,
  upsertFitProfile,
} from "@/lib/relay-api";
import type {
  FitAxis,
  FitProfileEntryDTO,
  Relationship,
  SizeAnchorDTO,
} from "@/lib/relay-api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRelay } from "@/lib/store";

/**
 * Fit Profiles selector — "who are you shopping for?" (plan.md §21.1, Phase 1).
 *
 * A True Fit-style, Amazon-native control: pick a person (You / partner / child),
 * and Return Confidence is scored for *their* wardrobe anchor. Captures the size
 * once (brand + size) and reuses it everywhere — never blocks the buy flow.
 */

const AXIS_NOUN: Record<FitAxis, string> = { tops: "top", bottoms: "bottom", shoes: "shoe" };

const SIZES: Record<FitAxis, string[]> = {
  tops: ["XS", "S", "M", "L", "XL", "XXL"],
  bottoms: ["28", "30", "32", "34", "36", "38", "40"],
  shoes: ["6", "7", "8", "9", "10", "11", "12"],
};

// A short list of well-known brands per axis — brand sizing is non-standard, so a
// "M at Uniqlo" anchor is far stronger than a bare "M" (the True Fit insight).
const BRANDS: Record<FitAxis, string[]> = {
  tops: ["Uniqlo", "H&M", "Zara", "Nike", "Adidas", "Levi's", "GAP", "US Polo", "Roadster"],
  bottoms: ["Levi's", "Wrangler", "Lee", "Uniqlo", "Zara", "Pepe Jeans", "H&M"],
  shoes: ["Nike", "Adidas", "Puma", "Reebok", "Bata", "Woodland", "Skechers"],
};

const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: "partner", label: "Partner" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Someone else" },
];

const RELATION_LABEL: Record<Relationship, string> = {
  self: "You",
  partner: "Partner",
  child: "Child",
  parent: "Parent",
  friend: "Friend",
  other: "",
};

function initials(name: string): string {
  return (name?.trim()?.[0] ?? "?").toUpperCase();
}

const selectCls =
  "h-8 rounded-md border border-border bg-card px-2 text-sm outline-none focus:border-foreground";

export function FitProfileSelector({
  axis = "tops",
  className = "",
}: {
  axis?: FitAxis;
  className?: string;
}) {
  const qc = useQueryClient();
  const { userId, fitProfileId, setFitProfileId } = useRelay();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const { data: state } = useQuery({
    queryKey: ["fit-profiles", userId],
    queryFn: () => getFitProfiles({ active_profile: "self", profiles: [] }),
  });
  const profiles = state?.profiles ?? [];
  const active =
    profiles.find((p) => p.id === fitProfileId) ??
    profiles.find((p) => p.is_self) ??
    profiles[0];

  // Switching the active profile changes the confidence query keys (which embed
  // fitProfileId) → those refetch automatically; we only need to persist server-side.
  const selectMut = useMutation({
    mutationFn: (id: string) => setActiveFitProfile(id),
    onMutate: (id: string) => {
      setFitProfileId(id);
      setOpen(false);
    },
    onSuccess: (s) => qc.setQueryData(["fit-profiles", userId], s),
  });

  // Saving an anchor (or a new person) DOES change the underlying score for the
  // same key, so invalidate the confidence queries explicitly.
  const invalidateConfidence = () =>
    qc.invalidateQueries({
      predicate: (q) => {
        const k = q.queryKey?.[0];
        return k === "cart-confidence" || k === "product-confidence";
      },
    });

  const saveMut = useMutation({
    mutationFn: (body: Parameters<typeof upsertFitProfile>[0]) => upsertFitProfile(body),
    onSuccess: async (s, vars) => {
      qc.setQueryData(["fit-profiles", userId], s);
      await invalidateConfidence();
      // If we just added a person, switch to them.
      if (!vars.id) {
        const created = s.profiles[s.profiles.length - 1];
        if (created) selectMut.mutate(created.id);
      }
    },
  });

  const triggerName = active?.name ?? "You";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:border-foreground transition ${className}`}
        >
          <span className="text-muted-foreground">Shopping for</span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="size-4 rounded-full bg-secondary text-[9px] font-semibold inline-flex items-center justify-center">
              {initials(triggerName)}
            </span>
            {triggerName}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="px-4 pt-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          Who are you shopping for?
        </div>
        <div className="max-h-72 overflow-y-auto pb-1">
          {profiles.map((p) => (
            <ProfileRow
              key={p.id}
              profile={p}
              axis={axis}
              selected={p.id === active?.id}
              onSelect={() => selectMut.mutate(p.id)}
              onSaveAnchor={(anchor) =>
                saveMut.mutate({
                  id: p.id,
                  name: p.name,
                  relationship: p.relationship,
                  anchors: { ...p.anchors, [axis]: anchor },
                  prefs: p.prefs,
                })
              }
              saving={saveMut.isPending}
            />
          ))}
        </div>

        <div className="border-t border-border p-2">
          {adding ? (
            <AddPersonForm
              axis={axis}
              busy={saveMut.isPending}
              onCancel={() => setAdding(false)}
              onAdd={(payload) => {
                saveMut.mutate(payload);
                setAdding(false);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-primary hover:bg-secondary transition"
            >
              <Plus className="size-4" /> Add someone you shop for
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ProfileRow({
  profile,
  axis,
  selected,
  onSelect,
  onSaveAnchor,
  saving,
}: {
  profile: FitProfileEntryDTO;
  axis: FitAxis;
  selected: boolean;
  onSelect: () => void;
  onSaveAnchor: (anchor: SizeAnchorDTO) => void;
  saving: boolean;
}) {
  const anchor = profile.anchors?.[axis];
  const rel = RELATION_LABEL[profile.relationship];
  const [editing, setEditing] = useState(false);

  return (
    <div className={`px-2 ${selected ? "bg-secondary/50" : ""}`}>
      <div className="flex items-center gap-3 rounded-md px-2 py-2">
        <button type="button" onClick={onSelect} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <span className="size-7 rounded-full bg-secondary text-xs font-semibold inline-flex items-center justify-center shrink-0">
            {initials(profile.name)}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium truncate">
              {profile.name}
              {rel && !profile.is_self && (
                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">· {rel}</span>
              )}
            </span>
            <span className="block text-[11px] text-muted-foreground truncate">
              {anchor
                ? `${AXIS_NOUN[axis]} size ${anchor.size}${anchor.brand ? ` · ${anchor.brand}` : ""}`
                : `No ${AXIS_NOUN[axis]} size saved`}
            </span>
          </span>
        </button>
        {selected && <Check className="size-4 text-primary shrink-0" />}
      </div>

      {/* Inline anchor capture — the one-time, non-blocking "add their size" prompt. */}
      {editing ? (
        <AnchorForm
          axis={axis}
          initial={anchor}
          busy={saving}
          onCancel={() => setEditing(false)}
          onSave={(a) => {
            onSaveAnchor(a);
            setEditing(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ml-11 mb-2 text-[11px] text-primary hover:underline"
        >
          {anchor ? "Edit size" : `Add ${AXIS_NOUN[axis]} size`}
        </button>
      )}
    </div>
  );
}

function AnchorForm({
  axis,
  initial,
  busy,
  onSave,
  onCancel,
}: {
  axis: FitAxis;
  initial?: SizeAnchorDTO;
  busy: boolean;
  onSave: (a: SizeAnchorDTO) => void;
  onCancel: () => void;
}) {
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [size, setSize] = useState(initial?.size ?? "");

  return (
    <div className="ml-11 mb-3 mr-2 space-y-2">
      <div className="text-[11px] text-muted-foreground">
        Their size in a brand they own — the most accurate signal.
      </div>
      <div className="flex gap-2">
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className={`${selectCls} flex-1`}>
          <option value="">Brand (optional)</option>
          {BRANDS[axis].map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select value={size} onChange={(e) => setSize(e.target.value)} className={`${selectCls} w-20`}>
          <option value="">Size</option>
          {SIZES[axis].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!size || busy}
          onClick={() => onSave({ size, brand: brand || null })}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddPersonForm({
  axis,
  busy,
  onAdd,
  onCancel,
}: {
  axis: FitAxis;
  busy: boolean;
  onAdd: (payload: Parameters<typeof upsertFitProfile>[0]) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("partner");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");

  return (
    <div className="p-2 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <UserRound className="size-4 text-muted-foreground" /> Add a person
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="h-8 flex-1 rounded-md border border-border bg-card px-2 text-sm outline-none focus:border-foreground"
        />
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as Relationship)}
          className={selectCls}
        >
          {RELATIONSHIPS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="text-[11px] text-muted-foreground">Their {AXIS_NOUN[axis]} size (optional)</div>
      <div className="flex gap-2">
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className={`${selectCls} flex-1`}>
          <option value="">Brand</option>
          {BRANDS[axis].map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select value={size} onChange={(e) => setSize(e.target.value)} className={`${selectCls} w-20`}>
          <option value="">Size</option>
          {SIZES[axis].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={!name.trim() || busy}
          onClick={() =>
            onAdd({
              name: name.trim(),
              relationship,
              anchors: size ? { [axis]: { size, brand: brand || null } } : {},
            })
          }
          className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
