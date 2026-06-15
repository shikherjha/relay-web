import { motion } from "framer-motion";

/** Amazon-style "smile" arc. Defaults to Relay green; override with `color`. */
export function SmileLogo({
  size = 28,
  color = "var(--color-relay)",
  animated = false,
}: {
  size?: number;
  color?: string;
  animated?: boolean;
}) {
  const MotionPath = motion.path;
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 100 56" fill="none" aria-hidden="true">
      <MotionPath
        d="M5 18 C 25 50, 75 50, 95 18"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
        initial={animated ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      {/* arrow tip */}
      <motion.path
        d="M82 26 L95 18 L92 33 Z"
        fill={color}
        initial={animated ? { opacity: 0, scale: 0.6 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
        style={{ transformOrigin: "90px 22px" }}
      />
    </svg>
  );
}
