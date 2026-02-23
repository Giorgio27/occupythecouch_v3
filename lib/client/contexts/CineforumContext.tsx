import { createContext, useContext, ReactNode } from "react";

type CineforumContextType = {
  cineforumId: string | null;
  cineforumName: string | null;
};

const CineforumContext = createContext<CineforumContextType>({
  cineforumId: null,
  cineforumName: null,
});

export function CineforumProvider({
  children,
  cineforumId,
  cineforumName,
}: {
  children: ReactNode;
  cineforumId: string | null;
  cineforumName?: string | null;
}) {
  return (
    <CineforumContext.Provider
      value={{ cineforumId, cineforumName: cineforumName ?? null }}
    >
      {children}
    </CineforumContext.Provider>
  );
}

export function useCineforum() {
  const context = useContext(CineforumContext);
  if (!context) {
    throw new Error("useCineforum must be used within CineforumProvider");
  }
  return context;
}
