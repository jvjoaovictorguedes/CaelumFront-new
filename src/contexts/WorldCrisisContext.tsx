"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "@/utils/axiosIntance";
import { useCharacter } from "./CharacterContext";
import type { CrisisStatus } from "@/types/contracts/worldCrisis";
const Context = createContext<{
  crisis: CrisisStatus | null;
  refresh: () => void;
}>({ crisis: null, refresh: () => {} });
export function WorldCrisisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { character } = useCharacter();
  const [crisis, setCrisis] = useState<CrisisStatus | null>(null);
  const refresh = useCallback(() => {
    if (!character?.id) return;
    void api
      .get("/world-crisis/status")
      .then((r) => setCrisis(r.data.data))
      .catch(() => {});
  }, [character?.id]);
  useEffect(() => {
    refresh();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      if (!timer)
        timer = setTimeout(() => {
          timer = undefined;
          refresh();
        }, 500);
    };
    window.addEventListener("caelum:world-crisis-update", update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener("caelum:world-crisis-update", update);
      window.removeEventListener("focus", update);
      if (timer) clearTimeout(timer);
    };
  }, [refresh]);
  return (
    <Context.Provider value={{ crisis, refresh }}>{children}</Context.Provider>
  );
}
export const useWorldCrisis = () => useContext(Context);
