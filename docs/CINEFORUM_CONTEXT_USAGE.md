# Cineforum Context Usage

## Overview

Il `CineforumContext` fornisce accesso al `cineforumId` e `cineforumName` in tutta l'applicazione senza dover passare props manualmente o fare fetch ripetuti.

## Come funziona

1. Ogni pagina sotto `/cineforum/[cineforumId]/*` usa `CineforumLayout` invece di `Layout`
2. `CineforumLayout` wrappa automaticamente l'app con il `CineforumProvider`
3. La funzione helper `getCineforumLayoutProps()` gestisce auth, membership e fetch del nome
4. Qualsiasi componente figlio può accedere ai dati usando l'hook `useCineforum()`

## Esempio di utilizzo

### In una pagina cineforum (pattern standard)

```tsx
// pages/cineforum/[cineforumId]/your-page.tsx
import { GetServerSideProps } from "next";
import CineforumLayout, {
  getCineforumLayoutProps,
} from "@/components/CineforumLayout";

interface YourPageProps {
  cineforumId: string;
  cineforumName: string;
  // ... altre props specifiche della pagina
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // Gestisce automaticamente auth, membership check e fetch del nome
  const cineforumProps = await getCineforumLayoutProps(ctx);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps) {
    return cineforumProps;
  }

  // Ora puoi aggiungere la tua logica specifica
  const { cineforumId } = cineforumProps.props;

  // ... fetch altri dati necessari ...

  return {
    props: {
      ...cineforumProps.props, // Include cineforumId e cineforumName
      // ... altre props
    },
  };
};

export default function YourPage({
  cineforumId,
  cineforumName,
  ...otherProps
}: YourPageProps) {
  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <YourContent />
    </CineforumLayout>
  );
}
```

### In un componente (recuperare i dati dal context)

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
✅ **Codice DRY**: La logica di auth e membership è centralizzata in `getCineforumLayoutProps()`  
✅ **Type-safe**: TypeScript ti avvisa se usi il context fuori dal provider  
✅ **Semplice**: Un solo hook per accedere ai dati ovunque

## Cosa fa getCineforumLayoutProps()

La funzione helper gestisce automaticamente:

1. ✅ Verifica autenticazione (redirect a `/auth/signin` se non loggato)
2. ✅ Verifica membership (404 se non membro o disabilitato)
3. ✅ Fetch del nome del cineforum dal database
4. ✅ Ritorna props pronte per il layout

## Pagine già migrate

Tutte le pagine sotto `/cineforum/[cineforumId]/*` ora usano `CineforumLayout`:

- ✅ [`pages/cineforum/[cineforumId]/index.tsx`](../pages/cineforum/[cineforumId]/index.tsx) - Homepage del cineforum
- ✅ [`pages/cineforum/[cineforumId]/oscars.tsx`](../pages/cineforum/[cineforumId]/oscars.tsx) - Pagina Oscars
- ✅ [`pages/cineforum/[cineforumId]/admin/proposals.tsx`](../pages/cineforum/[cineforumId]/admin/proposals.tsx) - Admin proposals
- ✅ [`pages/cineforum/[cineforumId]/admin/rounds.tsx`](../pages/cineforum/[cineforumId]/admin/rounds.tsx) - Admin rounds
- ✅ [`pages/cineforum/[cineforumId]/admin/teams.tsx`](../pages/cineforum/[cineforumId]/admin/teams.tsx) - Admin teams
- ✅ [`pages/cineforum/[cineforumId]/admin/users.tsx`](../pages/cineforum/[cineforumId]/admin/users.tsx) - Admin users

## Componenti che usano il context

- ✅ [`components/header/CineforumHeaderNav.tsx`](../components/header/CineforumHeaderNav.tsx) - Usa `useCineforum()` invece di `useRouter`

## Quando NON usarlo

- ❌ Pagine fuori da `/cineforum/[cineforumId]/*` - Usa il `Layout` normale
- ❌ Se hai bisogno del `cineforumId` solo in 1-2 componenti vicini - Passa la prop direttamente

## File correlati

- [`components/CineforumLayout.tsx`](../components/CineforumLayout.tsx) - Layout wrapper e helper function
- [`components/Layout.tsx`](../components/Layout.tsx) - Layout base che accetta props opzionali
- [`lib/client/contexts/CineforumContext.tsx`](../lib/client/contexts/CineforumContext.tsx) - Context e hook
- [`docs/CINEFORUM_CONTEXT_FLOW.md`](./CINEFORUM_CONTEXT_FLOW.md) - Spiegazione dettagliata del flusso
