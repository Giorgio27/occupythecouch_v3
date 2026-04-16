# Internationalization (i18n) Implementation Plan for CineForum

## Project Analysis

### Current State

- **Framework**: Next.js 16.2.1 (Pages Router)
- **Current Language**: Italian (hardcoded strings throughout the application)
- **Target Languages**: Italian (default) + English
- **Architecture**:
  - Pages Router with `getServerSideProps`
  - React components with TypeScript
  - Prisma ORM with PostgreSQL
  - NextAuth for authentication
  - Radix UI components

### Key Findings

1. **Extensive Italian content** in components, pages, and UI elements
2. **Server-side rendering** used extensively via `getServerSideProps`
3. **No existing i18n infrastructure**
4. **Complex UI** with landing pages, forms, dashboards, and admin panels
5. **Dynamic content** from database (movies, proposals, rankings)

---

## Recommended Solution: `react-i18next` (Client-Side, No URL Routing)

### Why `react-i18next`?

**Best fit for your requirements:**

1. ✅ **No URL Changes** - Same URLs for all languages (as requested)
2. ✅ **Browser Detection** - Automatic language detection from browser settings
3. ✅ **LocalStorage Persistence** - Saves user language preference
4. ✅ **Database Integration Ready** - Easy to override with user preference from DB later
5. ✅ **Lightweight** - Simpler setup, smaller bundle size
6. ✅ **TypeScript Support** - Full type safety for translations
7. ✅ **Namespace Support** - Organize translations by feature/page
8. ✅ **Instant Switching** - No page reload needed

### Why Not `next-i18next`?

- ❌ Requires URL-based routing (`/en/`, `/it/`)
- ❌ More complex setup for your simpler use case
- ❌ You explicitly don't want URL changes

### Language Detection Priority

1. **User preference in localStorage** (if previously set via language switcher)
2. **Browser language** (automatic detection on first visit)
3. **Fallback to Italian** (default)
4. **Future: User database preference** (will override all above)

---

## Implementation Architecture

### 1. Translation File Structure

```
locales/
├── it/                          # Italian (default)
│   ├── common.json              # Shared UI elements (buttons, labels, errors)
│   ├── landing.json             # Landing page content
│   ├── auth.json                # Authentication pages
│   ├── cineforum.json           # Cineforum main features
│   ├── proposal.json            # Proposal creation/voting
│   ├── rankings.json            # Rankings pages
│   ├── stats.json               # Statistics pages
│   ├── admin.json               # Admin panel
│   ├── navigation.json          # Headers, menus, navigation
│   └── validation.json          # Form validation messages
└── en/                          # English
    ├── common.json
    ├── landing.json
    ├── auth.json
    ├── cineforum.json
    ├── proposal.json
    ├── rankings.json
    ├── stats.json
    ├── admin.json
    ├── navigation.json
    └── validation.json
```

### 2. Configuration Files

#### `lib/i18n.ts` (i18n initialization)

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import commonIT from "@/locales/it/common.json";
import commonEN from "@/locales/en/common.json";
import landingIT from "@/locales/it/landing.json";
import landingEN from "@/locales/en/landing.json";
import authIT from "@/locales/it/auth.json";
import authEN from "@/locales/en/auth.json";
import cineforumIT from "@/locales/it/cineforum.json";
import cineforumEN from "@/locales/en/cineforum.json";
import proposalIT from "@/locales/it/proposal.json";
import proposalEN from "@/locales/en/proposal.json";
import rankingsIT from "@/locales/it/rankings.json";
import rankingsEN from "@/locales/en/rankings.json";
import statsIT from "@/locales/it/stats.json";
import statsEN from "@/locales/en/stats.json";
import adminIT from "@/locales/it/admin.json";
import adminEN from "@/locales/en/admin.json";
import navigationIT from "@/locales/it/navigation.json";
import navigationEN from "@/locales/en/navigation.json";
import validationIT from "@/locales/it/validation.json";
import validationEN from "@/locales/en/validation.json";

const resources = {
  it: {
    common: commonIT,
    landing: landingIT,
    auth: authIT,
    cineforum: cineforumIT,
    proposal: proposalIT,
    rankings: rankingsIT,
    stats: statsIT,
    admin: adminIT,
    navigation: navigationIT,
    validation: validationIT,
  },
  en: {
    common: commonEN,
    landing: landingEN,
    auth: authEN,
    cineforum: cineforumEN,
    proposal: proposalEN,
    rankings: rankingsEN,
    stats: statsEN,
    admin: adminEN,
    navigation: navigationEN,
    validation: validationEN,
  },
};

i18n
  .use(LanguageDetector) // Detects browser language
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "it",
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ["localStorage", "navigator"], // Check localStorage first, then browser
      caches: ["localStorage"], // Save preference to localStorage
      lookupLocalStorage: "i18nextLng",
    },
    debug: process.env.NODE_ENV === "development",
    saveMissing: true, // Log missing keys in development
  });

export default i18n;
```

#### Update `pages/_app.tsx`

```typescript
import '@/lib/i18n' // Initialize i18n (must be before other imports)
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <Head>
            <title>CineForum - Scegli film con gli amici</title>
            {/* ... rest of head */}
          </Head>
          <Component {...pageProps} />
        </ThemeProvider>
      </I18nextProvider>
    </SessionProvider>
  )
}
```

### 3. URL Structure

**No URL changes!** All languages use the same URLs:

- `https://yourapp.com/`
- `https://yourapp.com/cineforum/[id]/proposal`
- `https://yourapp.com/auth/signin`
- `https://yourapp.com/profile`

Language is determined by:

1. **User preference in localStorage** (if previously set)
2. **Browser language** (automatic detection)
3. **Future: User database preference** (override both above)

### 4. Language Switcher Component

Create [`components/LanguageSwitcher.tsx`](components/LanguageSwitcher.tsx:1):

```typescript
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'it' ? 'en' : 'it'
    i18n.changeLanguage(newLang)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2"
    >
      <Globe className="h-4 w-4" />
      {i18n.language === 'it' ? 'EN' : 'IT'}
    </Button>
  )
}
```

Add to header navigation for easy access.

---

## Implementation Strategy

### Phase 1: Setup & Infrastructure

1. Install dependencies (`react-i18next`, `i18next`, `i18next-browser-languagedetector`)
2. Create [`lib/i18n.ts`](lib/i18n.ts:1) configuration
3. Set up translation file structure (`locales/it/`, `locales/en/`)
4. Create base translation files (common, navigation)
5. Update [`pages/_app.tsx`](pages/_app.tsx:1) with i18n initialization
6. Create language switcher component
7. Add language switcher to header

### Phase 2: Core Pages Migration

1. Landing page ([`components/home/landing.tsx`](components/home/landing.tsx:1))
2. Authentication pages ([`pages/auth/signin.tsx`](pages/auth/signin.tsx:1), [`pages/auth/signup.tsx`](pages/auth/signup.tsx:1))
3. Main layout components ([`components/Header.tsx`](components/Header.tsx:1), [`components/Footer.tsx`](components/Footer.tsx:1))
4. Navigation ([`components/header/CineforumHeaderNav.tsx`](components/header/CineforumHeaderNav.tsx:1))

### Phase 3: Cineforum Features

1. Proposal creation ([`components/cineforum/proposal/create/CreateProposal.tsx`](components/cineforum/proposal/create/CreateProposal.tsx:1))
2. Voting interfaces
3. Rankings pages
4. Statistics pages

### Phase 4: Admin & Advanced Features

1. Admin panels
2. User management
3. Team management
4. Round management

### Phase 5: Polish & Optimization

1. Error messages and validation
2. Meta tags (dynamic based on language)
3. Date/time formatting
4. Number formatting
5. Testing and QA

---

## Technical Implementation Details

### Server-Side Props Pattern

**No changes needed!** Since we're using client-side language detection:

```typescript
export const getServerSideProps: GetServerSideProps = async (context) => {
  return getCineforumLayoutProps(context);
};
```

Language switching happens entirely on the client side.

### Component Usage Pattern

**Before:**

```tsx
<h2>Crea una nuova proposta</h2>
<Button>Crea proposta</Button>
<p>Compila tutti i campi e seleziona almeno un film</p>
```

**After:**

```tsx
import { useTranslation } from "react-i18next";

function CreateProposal() {
  const { t } = useTranslation("proposal");

  return (
    <>
      <h2>{t("create.title")}</h2>
      <Button>{t("create.submit")}</Button>
      <p>{t("create.validation.required")}</p>
    </>
  );
}
```

### Translation File Example

**`locales/it/proposal.json`:**

```json
{
  "create": {
    "title": "Crea una nuova proposta",
    "subtitle": "Imposta data e descrizione, poi aggiungi i film",
    "submit": "Crea proposta",
    "fields": {
      "date": "Data di proiezione",
      "title": "Titolo proposta",
      "titlePlaceholder": "Es. Oscar night, Horror Friday…",
      "description": "Descrizione",
      "descriptionPlaceholder": "Descrivi il mood della serata, il tema, o qualsiasi dettaglio che renda speciale questa proposta…"
    },
    "validation": {
      "required": "Compila tutti i campi e seleziona almeno un film",
      "minMovies": "Serve almeno 1 film. Più scelta = voto più divertente."
    },
    "search": {
      "title": "Cerca e aggiungi film",
      "results": "Risultati della ricerca",
      "selected": "{{count}} film selezionato",
      "selected_plural": "{{count}} film selezionati"
    }
  }
}
```

**`locales/en/proposal.json`:**

```json
{
  "create": {
    "title": "Create a new proposal",
    "subtitle": "Set date and description, then add movies",
    "submit": "Create proposal",
    "fields": {
      "date": "Screening date",
      "title": "Proposal title",
      "titlePlaceholder": "E.g. Oscar night, Horror Friday…",
      "description": "Description",
      "descriptionPlaceholder": "Describe the mood of the evening, the theme, or any detail that makes this proposal special…"
    },
    "validation": {
      "required": "Fill in all fields and select at least one movie",
      "minMovies": "At least 1 movie required. More choices = more fun voting."
    },
    "search": {
      "title": "Search and add movies",
      "results": "Search results",
      "selected": "{{count}} movie selected",
      "selected_plural": "{{count}} movies selected"
    }
  }
}
```

---

## Special Considerations

### 1. Dynamic Content (Database)

- **Movie titles, descriptions**: Keep in original language (from TMDB/IMDB)
- **User-generated content**: Store as-is, no translation needed
- **System messages**: Translate via i18n

### 2. Date & Time Formatting

Use `date-fns` with locale support:

```typescript
import { format } from 'date-fns'
import { it, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { i18n } = useTranslation()
  const locale = i18n.language === 'it' ? it : enUS

  return <span>{format(date, 'PPP', { locale })}</span>
}
```

### 3. Number Formatting

Use `Intl.NumberFormat`:

```typescript
import { useTranslation } from 'react-i18next'

function RatingDisplay({ rating }: { rating: number }) {
  const { i18n } = useTranslation()

  const formatter = new Intl.NumberFormat(i18n.language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })

  return <span>{formatter.format(rating)}</span> // 8.5 or 8,5 based on locale
}
```

### 4. Pluralization

i18next handles plurals automatically:

```json
{
  "movies": "{{count}} film",
  "movies_plural": "{{count}} film"
}
```

For English:

```json
{
  "movies": "{{count}} movie",
  "movies_plural": "{{count}} movies"
}
```

### 5. Meta Tags (Dynamic)

Update meta tags based on current language:

```tsx
import { useTranslation } from "react-i18next";

function App() {
  const { t, i18n } = useTranslation();

  return (
    <Head>
      <title>{t("common:meta.title")}</title>
      <meta name="description" content={t("common:meta.description")} />
      <meta property="og:locale" content={i18n.language} />
    </Head>
  );
}
```

### 6. Future: User Database Preference

Add to User schema:

```prisma
model User {
  // ... existing fields
  preferredLanguage String? @default("it")
}
```

Override in [`pages/_app.tsx`](pages/_app.tsx:1):

```typescript
import { useSession } from "next-auth/react";
import { useEffect } from "react";

function App() {
  const { data: session } = useSession();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (session?.user?.preferredLanguage) {
      i18n.changeLanguage(session.user.preferredLanguage);
    }
  }, [session, i18n]);

  // ... rest of app
}
```

---

## Migration Strategy

### Incremental Approach (Recommended)

1. **Start with infrastructure** - Set up i18n without breaking existing code
2. **Add language switcher** - Make it visible but optional
3. **Migrate page by page** - Start with high-traffic pages
4. **Test thoroughly** - Each page in both languages
5. **Gradual rollout** - Enable for users progressively

### Benefits:

- ✅ No big-bang deployment
- ✅ Easy to rollback if issues arise
- ✅ Can test with real users incrementally
- ✅ Maintains stability

---

## Package Dependencies

```json
{
  "dependencies": {
    "react-i18next": "^14.0.5",
    "i18next": "^23.8.2",
    "i18next-browser-languagedetector": "^7.2.0",
    "date-fns": "^3.3.1"
  }
}
```

**Note**: No `next-i18next` needed! Simpler dependency tree.

---

## Estimated Scope

### Translation Keys to Create

Based on code analysis:

- **~500-700 translation keys** across all namespaces
- **Landing page**: ~50 keys
- **Auth pages**: ~30 keys
- **Proposal system**: ~80 keys
- **Rankings**: ~60 keys
- **Admin panels**: ~100 keys
- **Common UI**: ~150 keys
- **Navigation**: ~40 keys
- **Validation/Errors**: ~50 keys

### Files to Modify

- **~60 component files** need translation updates
- **1 i18n config file** to create ([`lib/i18n.ts`](lib/i18n.ts:1))
- **1 app file** update ([`pages/_app.tsx`](pages/_app.tsx:1))
- **1 language switcher component** to create
- **No `next.config.js` changes needed**

---

## Testing Strategy

### 1. Manual Testing Checklist

- [ ] All pages render in both languages
- [ ] Language switcher works on all pages
- [ ] Language preference persists in localStorage
- [ ] Browser language detection works on first visit
- [ ] Forms validate in correct language
- [ ] Error messages display in correct language
- [ ] Date/time formats are locale-appropriate
- [ ] Number formats are locale-appropriate
- [ ] No flash of untranslated content

### 2. Automated Testing

- Add tests for translation key existence
- Test language switching functionality
- Verify localStorage persistence

### 3. Translation Quality

- Native speaker review for English translations
- Consistency check across all namespaces
- Terminology glossary for domain-specific terms

---

## Maintenance & Best Practices

### 1. Translation Workflow

1. Developer adds Italian text (default)
2. Developer adds translation key to both `it` and `en` files
3. English translation reviewed by native speaker
4. Keys organized by namespace/feature

### 2. Code Standards

```typescript
// ✅ Good - Organized, clear keys
t("proposal:create.title");
t("proposal:create.fields.date");

// ❌ Bad - Flat, unclear keys
t("title");
t("date");
```

### 3. Missing Translation Handling

Configure fallback behavior in [`lib/i18n.ts`](lib/i18n.ts:1):

```typescript
i18n.init({
  fallbackLng: "it",
  debug: process.env.NODE_ENV === "development",
  saveMissing: true, // Log missing keys in development
});
```

---

## Rollout Plan

### Week 1: Setup

- Install packages
- Configure i18n
- Create translation file structure
- Set up language switcher

### Week 2-3: Core Pages

- Landing page
- Auth pages
- Main navigation
- Common components

### Week 4-5: Features

- Proposal system
- Voting interfaces
- Rankings

### Week 6: Admin & Polish

- Admin panels
- Error handling
- Testing
- Documentation

### Week 7: Review & Launch

- Translation review
- QA testing
- Soft launch
- Monitor feedback

---

## Future Enhancements

### Easy to Add Later:

1. **More languages** - Just add new locale folders
2. **RTL support** - For Arabic, Hebrew, etc.
3. **Translation management** - Tools like Lokalise, Crowdin
4. **User preference in database** - Override browser/localStorage:
   ```typescript
   // In _app.tsx or user profile load
   useEffect(() => {
     if (user?.preferredLanguage) {
       i18n.changeLanguage(user.preferredLanguage);
     }
   }, [user]);
   ```
5. **Regional variants** - en-US, en-GB, it-IT, it-CH

---

## Risk Mitigation

### Potential Issues & Solutions

| Risk                            | Impact | Mitigation                                           |
| ------------------------------- | ------ | ---------------------------------------------------- |
| Breaking existing functionality | High   | Incremental migration, thorough testing              |
| Incomplete translations         | Medium | Start with Italian (complete), add English gradually |
| SEO impact                      | Low    | Single URL structure, default language indexed       |
| Performance overhead            | Low    | Client-side only, minimal bundle size                |
| Translation inconsistency       | Medium | Create glossary, review process                      |
| Flash of untranslated content   | Low    | Load translations before render, use Suspense        |

---

## Success Metrics

### Key Performance Indicators

1. **All pages available in both languages** - 100% coverage
2. **No broken translations** - All keys have values
3. **User adoption** - Track language preference distribution
4. **Performance** - No significant slowdown (<50ms overhead)
5. **User satisfaction** - Feedback from English-speaking users

---

## Resources & Documentation

### Official Documentation

- [react-i18next](https://react.i18next.com/)
- [i18next](https://www.i18next.com/)
- [i18next-browser-languagedetector](https://github.com/i18next/i18next-browser-languageDetector)

### Useful Tools

- [i18n Ally VSCode Extension](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) - Translation management in IDE
- [BabelEdit](https://www.codeandweb.com/babeledit) - Translation file editor
- [Google Translate API](https://cloud.google.com/translate) - For initial translations (review required)

---

## Conclusion

**Recommended Approach**: Implement `react-i18next` with client-side language detection (no URL routing).

**Timeline**: 5-6 weeks for complete implementation

**Effort**: Low-Medium complexity, simpler than URL-based routing

**Benefits**:

- ✅ **Simpler setup** - No URL routing complexity
- ✅ **Same URLs** - No SEO concerns or redirects
- ✅ **Browser detection** - Automatic language selection
- ✅ **LocalStorage persistence** - User preference saved
- ✅ **Database ready** - Easy to add user preference later
- ✅ **Lightweight** - Smaller bundle size
- ✅ **Instant switching** - No page reload needed

**Trade-offs**:

- ⚠️ **No SEO for multiple languages** - Only default language indexed (acceptable for your use case)
- ⚠️ **Client-side only** - Initial render in default language, then switches (minimal flash)

**Next Steps**: Review this plan and proceed to implementation phase.
