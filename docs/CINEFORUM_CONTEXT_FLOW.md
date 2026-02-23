# Come funziona il CineforumContext - Flusso completo

## 📊 Diagramma del flusso

```
1. URL: /cineforum/abc123
         ↓
2. getServerSideProps (SERVER)
   - Legge "abc123" dall'URL
   - Fa query al database
   - Recupera cineforumName
         ↓
3. return { props: { cineforumId: "abc123", cineforumName: "My Cinema" } }
         ↓
4. CineforumHome riceve le props
   function CineforumHome({ cineforumId, cineforumName }) {
         ↓
5. Le passa al Layout
   <Layout cineforumId={cineforumId} cineforumName={cineforumName}>
         ↓
6. Layout le mette nel Context Provider
   <CineforumProvider cineforumId="abc123" cineforumName="My Cinema">
         ↓
7. Qualsiasi componente figlio può leggerle
   const { cineforumId, cineforumName } = useCineforum()
   // cineforumId = "abc123"
   // cineforumName = "My Cinema"
```

## 🔍 Esempio pratico passo per passo

### STEP 1: L'utente visita la pagina

```
URL: http://localhost:3000/cineforum/abc123
```

### STEP 2: Next.js esegue getServerSideProps (LATO SERVER)

```tsx
// pages/cineforum/[cineforumId]/index.tsx - linea 28-73

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // 1. Legge "abc123" dall'URL
  const cineforumId = ctx.params?.cineforumId as string; // "abc123"

  // 2. Fa query al database per prendere il nome
  const cf = await prisma.cineforum.findUnique({
    where: { id: cineforumId },
    select: { name: true },
  });

  // 3. Restituisce i dati come props
  return {
    props: {
      cineforumId: "abc123",           // ← QUESTO VIENE DALL'URL
      cineforumName: "My Cinema Club",  // ← QUESTO VIENE DAL DATABASE
      last: { ... }
    }
  };
};
```

### STEP 3: Il componente riceve le props (LATO CLIENT)

```tsx
// pages/cineforum/[cineforumId]/index.tsx - linea 75-79

export default function CineforumHome({
  cineforumId,    // = "abc123"
  cineforumName,  // = "My Cinema Club"
  last,
}: Props) {
```

### STEP 4: Le props vengono passate al Layout

```tsx
// pages/cineforum/[cineforumId]/index.tsx - linea 99-107

return (
  <Layout
    cineforumId={cineforumId} // ← Passa "abc123"
    cineforumName={cineforumName} // ← Passa "My Cinema Club"
  >
    <div>{/* contenuto della pagina */}</div>
  </Layout>
);
```

### STEP 5: Layout mette i dati nel Context Provider

```tsx
// components/Layout.tsx - linea 11-27

export default function Layout({
  children,
  cineforumId = null, // ← Riceve "abc123"
  cineforumName = null, // ← Riceve "My Cinema Club"
}: LayoutProps) {
  return (
    <CineforumProvider
      cineforumId={cineforumId} // ← Mette nel context
      cineforumName={cineforumName} // ← Mette nel context
    >
      <div className="min-h-dvh flex flex-col bg-background text-foreground">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <Footer />
      </div>
    </CineforumProvider>
  );
}
```

### STEP 6: Il Context Provider rende i dati disponibili

```tsx
// lib/client/contexts/CineforumContext.tsx - linea 12-23

export function CineforumProvider({
  children,
  cineforumId, // = "abc123"
  cineforumName, // = "My Cinema Club"
}: {
  children: ReactNode;
  cineforumId: string | null;
  cineforumName?: string | null;
}) {
  return (
    <CineforumContext.Provider
      value={{
        cineforumId, // ← Questi valori sono ora disponibili
        cineforumName, // ← a TUTTI i componenti figli
      }}
    >
      {children}
    </CineforumContext.Provider>
  );
}
```

### STEP 7: Qualsiasi componente figlio può leggere i dati

```tsx
// components/header/CineforumHeaderNav.tsx - linea 12

export default function CineforumHeaderNav() {
  const { cineforumId } = useCineforum(); // ← Legge "abc123" dal context

  // Ora posso usare cineforumId senza doverlo passare come prop!
  const cinemaLinks = [
    { label: "Proposals", href: `/cineforum/${cineforumId}` },
    { label: "Oscars", href: `/cineforum/${cineforumId}/oscars` },
  ];

  // ...
}
```

## 🎯 Punti chiave

1. **I dati partono dall'URL** → Next.js legge `[cineforumId]` dall'URL
2. **getServerSideProps fa il fetch** → Una volta sola, lato server
3. **Le props scendono** → Da pagina → Layout → Context Provider
4. **Il Context distribuisce** → Tutti i componenti figli possono leggere
5. **Nessun fetch ripetuto** → I dati sono già in memoria

## ❌ Cosa NON succede

- ❌ Il Layout NON fa fetch
- ❌ Il Context NON fa fetch
- ❌ Non c'è localStorage o sessionStorage
- ❌ Non c'è chiamata API dal client

## ✅ Cosa succede

- ✅ Il fetch avviene UNA VOLTA nel getServerSideProps
- ✅ I dati vengono passati come props
- ✅ Il Context li rende disponibili ovunque
- ✅ Zero chiamate API extra dal client
