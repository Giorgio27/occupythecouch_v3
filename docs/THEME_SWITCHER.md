# Theme Switcher

## Panoramica

Il sistema di theme switcher permette agli utenti di passare tra tema chiaro e scuro dall'header del profilo.

## Implementazione

### 1. CSS Themes (`styles/globals.css`)

Sono stati definiti due temi:

- **Dark Theme** (default): Colori scuri con rosso cinema
- **Light Theme**: Colori chiari con lo stesso rosso cinema per coerenza

I temi sono applicati tramite le classi `.dark` e `.light` sull'elemento `<html>`.

### 2. Theme Context (`lib/client/contexts/ThemeContext.tsx`)

Provider React che gestisce:

- Stato del tema corrente
- Persistenza in localStorage
- Toggle tra light/dark
- Applicazione della classe CSS al documento

### 3. User Profile Menu (`components/header/UserProfileMenu.tsx`)

Componente condiviso che include:

- Informazioni utente
- Link al profilo
- **Theme toggle** con icone Sun/Moon
- Logout

### 4. Integration

Il componente `UserProfileMenu` è utilizzato in:

- [`AppHeader.tsx`](../components/header/AppHeader.tsx) - Header semplice
- [`CineforumHeaderNav.tsx`](../components/header/CineforumHeaderNav.tsx) - Header con navigazione cineforum

### 5. No-Flash Script (`pages/_document.tsx`)

Script inline che carica il tema da localStorage prima del render per evitare il flash del tema sbagliato.

## Utilizzo

Gli utenti possono cambiare tema:

1. Cliccando sul menu profilo nell'header
2. Selezionando "Tema chiaro" o "Tema scuro"
3. Il tema viene salvato automaticamente e applicato a tutte le pagine

## Personalizzazione

Per modificare i colori del tema light, editare le variabili CSS in `styles/globals.css`:

```css
.light {
  --background: var(--cine-bg-light);
  --foreground: var(--cine-text-light);
  /* ... altre variabili ... */
}
```
