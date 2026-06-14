import { create } from "zustand";
import { BUYER_USER_ID, DEMO_USER_ID } from "./demo-constants";

export type Persona = "seller" | "buyer";

type Store = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  userId: string;
  persona: Persona;
  setPersona: (persona: Persona) => void;
  co2Kg: number;
  credits: number;
  lockedCredits: number;
  setImpact: (co2: number, credits: number, locked: number) => void;
  addImpact: (co2: number, credits: number) => void;
  claimed: string[];
  claim: (id: string) => void;
};

export const useRelay = create<Store>((set) => ({
  theme: "light",
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next === "dark");
      }
      return { theme: next };
    }),
  userId: DEMO_USER_ID,
  persona: "seller",
  setPersona: (persona) =>
    set({
      persona,
      userId: persona === "seller" ? DEMO_USER_ID : BUYER_USER_ID,
    }),
  co2Kg: 0,
  credits: 0,
  lockedCredits: 0,
  setImpact: (co2, credits, locked) =>
    set({ co2Kg: co2, credits, lockedCredits: locked }),
  addImpact: (co2, credits) =>
    set((s) => ({ co2Kg: +(s.co2Kg + co2).toFixed(1), credits: s.credits + credits })),
  claimed: [],
  claim: (id) => set((s) => ({ claimed: [...s.claimed, id] })),
}));
