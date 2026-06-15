import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useRelay } from "@/lib/store";
import { SmileLogo } from "./SmileLogo";

/** Hook: trigger the green-smile flyout, then navigate. */
export function useSmileNavigate() {
  const navigate = useNavigate();
  const setTransitioning = useRelay((s) => s.setTransitioning);
  return (to: string) => {
    setTransitioning(true);
    setTimeout(() => {
      navigate({ to: to as never });
      setTimeout(() => setTransitioning(false), 250);
    }, 850);
  };
}

export function SmileTransitionOverlay() {
  const transitioning = useRelay((s) => s.transitioning);
  return (
    <AnimatePresence>
      {transitioning && (
        <motion.div
          key="smile-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "color-mix(in oklab, var(--color-canvas) 92%, var(--color-relay))" }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            className="flex flex-col items-center gap-5"
          >
            <SmileLogo size={140} color="var(--color-relay)" animated />
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground"
            >
              Entering Relay · second-life
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
