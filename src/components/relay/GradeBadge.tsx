import { gradeColor, type Grade } from "@/lib/mock-data";

export function GradeBadge({ grade, size = "md", confidence }: { grade: Grade; size?: "sm" | "md" | "lg"; confidence?: number }) {
  const px = size === "lg" ? 76 : size === "sm" ? 28 : 44;
  const fs = size === "lg" ? 26 : size === "sm" ? 11 : 16;
  const ring = confidence !== undefined && size === "lg";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: px, height: px }}>
      {ring && (
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-border)" strokeWidth="4" />
          <circle
            cx="50" cy="50" r="46" fill="none"
            stroke={gradeColor[grade]} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${(confidence! / 100) * 289} 289`}
          />
        </svg>
      )}
      <div
        className="rounded-full font-semibold flex items-center justify-center tabular text-white"
        style={{
          width: ring ? px - 16 : px,
          height: ring ? px - 16 : px,
          background: gradeColor[grade],
          fontSize: fs,
          letterSpacing: "-0.02em",
        }}
      >
        {grade}
      </div>
    </div>
  );
}