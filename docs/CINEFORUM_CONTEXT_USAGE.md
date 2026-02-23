# Cineforum Context Usage

## Overview

Il `CineforumContext` fornisce accesso al `cineforumId` e `cineforumName` in tutta l'applicazione senza dover passare props manualmente o fare fetch ripetuti.

## Come funziona

1. Il [`Layout`](../components/Layout.tsx) wrappa l'app con il `CineforumProvider`
2. Le pagine passano `cineforumId` e `cineforumName` al Layout come props
3. Qualsiasi componente figlio può accedere ai dati usando l'hook `useCineforum()`

## Esempio di utilizzo

### In una pagina (passare i dati al Layout)

```tsx
// pages/cineforum/[cineforumId]/index.tsx
export default function CineforumHome({ cineforumId, cineforumName }: Props) {
  return (
    <Layout cineforumId={cineforumId} cineforumName={cineforumName}>
      <YourComponent />
    </Layout>
  );
}
```

### In un componente (recuperare i dati)

```tsx
// components/YourComponent.tsx
import { useCineforum } from "@/lib/client/contexts/CineforumContext";

export default function YourComponent() {
  const { cineforumId, cineforumName } = useCineforum();

  // cineforumId sarà null se non siamo in una pagina di cineforum
  if (!cineforumId) {
    return <div>Non sei in un cineforum</div>;
  }

  return (
    <div>
      <h1>{cineforumName}</h1>
      <p>ID: {cineforumId}</p>
    </div>
  );
}
```

## Vantaggi

✅ **No prop drilling**: Non serve passare `cineforumId` attraverso 5 livelli di componenti  
✅ **No fetch ripetuti**: I dati vengono recuperati una volta sola nel `getServerSideProps`  
✅ **Type-safe**: TypeScript ti avvisa se usi il context fuori dal provider  
✅ **Semplice**: Un solo hook per accedere ai dati ovunque

## Quando NON usarlo

- Se hai bisogno del `cineforumId` solo in 1-2 componenti, passa la prop direttamente
- Se il componente è usato anche fuori dal context di un cineforum, gestisci il caso `null`

## Componenti già aggiornati

- [`components/header/CineforumHeaderNav.tsx`](../components/header/CineforumHeaderNav.tsx) - Usa il context invece di `useRouter`
- [`pages/cineforum/[cineforumId]/index.tsx`](../pages/cineforum/[cineforumId]/index.tsx) - Passa i dati al Layout

## TODO: Componenti da aggiornare

Questi componenti potrebbero beneficiare del context:

- `pages/cineforum/[cineforumId]/oscars.tsx`
- `pages/cineforum/[cineforumId]/admin/*.tsx`
- Altri componenti che attualmente usano `router.query.cineforumId`
