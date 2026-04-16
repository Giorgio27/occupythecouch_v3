# i18n Implementation Checklist

This checklist provides step-by-step instructions for implementing internationalization in the CineForum project using `react-i18next` with client-side language detection (no URL routing).

---

## Phase 1: Setup & Infrastructure

### 1.1 Install Dependencies

- [ ] Install required packages:
  ```bash
  npm install react-i18next i18next i18next-browser-languagedetector date-fns
  ```
- [ ] Verify installation in `package.json`

### 1.2 Create Translation Directory Structure

- [ ] Create `locales/` directory in project root
- [ ] Create `locales/it/` directory (Italian - default)
- [ ] Create `locales/en/` directory (English)
- [ ] Create empty JSON files in `locales/it/`:
  - [ ] `common.json`
  - [ ] `landing.json`
  - [ ] `auth.json`
  - [ ] `cineforum.json`
  - [ ] `proposal.json`
  - [ ] `rankings.json`
  - [ ] `stats.json`
  - [ ] `admin.json`
  - [ ] `navigation.json`
  - [ ] `validation.json`
- [ ] Create corresponding empty JSON files in `locales/en/`

### 1.3 Configure i18n

- [ ] Create `lib/i18n.ts` with configuration (see plan for full code)
- [ ] Import all translation namespaces
- [ ] Configure language detector (localStorage + navigator)
- [ ] Set fallback language to Italian
- [ ] Enable debug mode for development

### 1.4 Update Application Entry Point

- [ ] Update `pages/_app.tsx`:
  - [ ] Import `@/lib/i18n` at the top (before other imports)
  - [ ] Import `I18nextProvider` from `react-i18next`
  - [ ] Wrap app with `<I18nextProvider i18n={i18n}>`
- [ ] Test that app still runs without errors

### 1.5 Create Language Switcher Component

- [ ] Create `components/LanguageSwitcher.tsx`
- [ ] Implement toggle between IT/EN
- [ ] Add Globe icon from lucide-react
- [ ] Style with existing UI components
- [ ] Test language switching in isolation

### 1.6 Add Language Switcher to Header

- [ ] Add `<LanguageSwitcher />` to `components/header/AppHeader.tsx`
- [ ] Add `<LanguageSwitcher />` to `components/header/PublicHeader.tsx`
- [ ] Position appropriately in header layout
- [ ] Test visibility on all pages

### 1.7 Initial Testing

- [ ] Verify language switcher appears
- [ ] Verify language preference saves to localStorage
- [ ] Verify browser language detection works
- [ ] Check console for any errors

---

## Phase 2: Core Pages Migration

### 2.1 Common Translations

- [ ] Create `locales/it/common.json` with:
  - [ ] Button labels (save, cancel, delete, edit, etc.)
  - [ ] Common actions (create, update, close, open, etc.)
  - [ ] Status labels (active, closed, pending, etc.)
  - [ ] Error messages (generic)
  - [ ] Loading states
  - [ ] Empty states
  - [ ] Meta tags (title, description)
- [ ] Create corresponding `locales/en/common.json`
- [ ] Test common translations display correctly

### 2.2 Navigation Translations

- [ ] Create `locales/it/navigation.json` with:
  - [ ] Main menu items
  - [ ] Dropdown labels
  - [ ] Breadcrumbs
  - [ ] Footer links
- [ ] Create corresponding `locales/en/navigation.json`
- [ ] Update `components/header/CineforumHeaderNav.tsx`:
  - [ ] Import `useTranslation`
  - [ ] Replace hardcoded Italian strings
  - [ ] Test all navigation items
- [ ] Update `components/Footer.tsx` (if exists)

### 2.3 Landing Page

- [ ] Create `locales/it/landing.json` with all landing page content:
  - [ ] Hero section (title, subtitle, CTA)
  - [ ] Features section
  - [ ] How it works section
  - [ ] Stats section
  - [ ] Final CTA section
- [ ] Create corresponding `locales/en/landing.json`
- [ ] Update `components/home/landing.tsx`:
  - [ ] Import `useTranslation('landing')`
  - [ ] Replace all hardcoded strings
  - [ ] Test hero section
  - [ ] Test features section
  - [ ] Test how it works section
  - [ ] Test stats section
  - [ ] Test final CTA
- [ ] Verify animations still work
- [ ] Test responsive design in both languages

### 2.4 Authentication Pages

- [ ] Create `locales/it/auth.json` with:
  - [ ] Sign in page content
  - [ ] Sign up page content
  - [ ] Form labels and placeholders
  - [ ] Validation messages
  - [ ] Success/error messages
- [ ] Create corresponding `locales/en/auth.json`
- [ ] Update `pages/auth/signin.tsx`:
  - [ ] Import `useTranslation('auth')`
  - [ ] Replace all strings
  - [ ] Test form labels
  - [ ] Test validation messages
- [ ] Update `pages/auth/signup.tsx`:
  - [ ] Import `useTranslation('auth')`
  - [ ] Replace all strings
  - [ ] Test form functionality
- [ ] Test authentication flow in both languages

### 2.5 Home/Dashboard Page

- [ ] Create translations for authenticated home page
- [ ] Update `components/home/auth.tsx`:
  - [ ] Replace cineforum list strings
  - [ ] Replace create cineforum strings
  - [ ] Replace search/filter strings
- [ ] Test cineforum creation flow
- [ ] Test cineforum list display

---

## Phase 3: Cineforum Features

### 3.1 Proposal System

- [ ] Create `locales/it/proposal.json` with:
  - [ ] Create proposal form
  - [ ] Movie search interface
  - [ ] Selected movies display
  - [ ] Validation messages
  - [ ] Success messages
  - [ ] Open proposal view
  - [ ] Closed proposal view
  - [ ] Voting interface
  - [ ] Results display
- [ ] Create corresponding `locales/en/proposal.json`
- [ ] Update `components/cineforum/proposal/create/CreateProposal.tsx`:
  - [ ] Import `useTranslation('proposal')`
  - [ ] Replace form labels
  - [ ] Replace placeholders
  - [ ] Replace validation messages
  - [ ] Test form submission
- [ ] Update `components/cineforum/proposal/create/MovieSearch.tsx`:
  - [ ] Replace search placeholder
  - [ ] Test search functionality
- [ ] Update `components/cineforum/proposal/create/SelectedMovies.tsx`:
  - [ ] Replace display strings
- [ ] Update `components/cineforum/proposal/open/OpenProposal.tsx`:
  - [ ] Replace voting interface strings
  - [ ] Test voting flow
- [ ] Update `components/cineforum/proposal/open/MovieRankRow.tsx`:
  - [ ] Replace ranking strings
- [ ] Update `components/cineforum/proposal/open/ResultsPanel.tsx`:
  - [ ] Replace results strings
- [ ] Update `components/cineforum/proposal/closed/ClosedProposal.tsx`:
  - [ ] Replace closed proposal strings
- [ ] Test complete proposal workflow in both languages

### 3.2 Rankings Pages

- [ ] Create `locales/it/rankings.json` with:
  - [ ] Movies ranking page
  - [ ] Users ranking page
  - [ ] Directors ranking page
  - [ ] Countries ranking page
  - [ ] Comparison tables
  - [ ] Filter labels
  - [ ] Sort options
- [ ] Create corresponding `locales/en/rankings.json`
- [ ] Update `pages/cineforum/[cineforumId]/rankings/movies.tsx`:
  - [ ] Import `useTranslation('rankings')`
  - [ ] Replace page title and headers
  - [ ] Replace filter/sort labels
  - [ ] Test ranking display
- [ ] Update `pages/cineforum/[cineforumId]/rankings/users.tsx`:
  - [ ] Replace user ranking strings
  - [ ] Replace search placeholder
  - [ ] Test user ranking display
- [ ] Update `pages/cineforum/[cineforumId]/rankings/directors.tsx`:
  - [ ] Replace director ranking strings
- [ ] Update `pages/cineforum/[cineforumId]/rankings/countries.tsx`:
  - [ ] Replace country ranking strings
- [ ] Update `components/cineforum/rankings/ComparisonTable.tsx`:
  - [ ] Replace comparison labels
- [ ] Update `components/cineforum/rankings/RankingCard.tsx`:
  - [ ] Replace card content strings
- [ ] Update `components/cineforum/rankings/RankingHeader.tsx`:
  - [ ] Replace header strings
- [ ] Test all ranking pages in both languages

### 3.3 Statistics Pages

- [ ] Create `locales/it/stats.json` with:
  - [ ] User statistics labels
  - [ ] Chart labels
  - [ ] Stat categories
  - [ ] Tooltips
  - [ ] Empty states
- [ ] Create corresponding `locales/en/stats.json`
- [ ] Update `pages/cineforum/[cineforumId]/stats/users.tsx`:
  - [ ] Import `useTranslation('stats')`
  - [ ] Replace all stat labels
  - [ ] Replace chart labels
  - [ ] Test statistics display
- [ ] Update `components/cineforum/rankings/UserRankingTrendChart.tsx`:
  - [ ] Replace chart strings
  - [ ] Test chart rendering
- [ ] Test statistics page in both languages

### 3.4 Movies/Videoteca Page

- [ ] Add movie page strings to appropriate namespace
- [ ] Update `pages/cineforum/[cineforumId]/movies.tsx`:
  - [ ] Replace page title
  - [ ] Replace filter/search strings
  - [ ] Test movie list display

### 3.5 Oscars Page

- [ ] Add oscars strings to appropriate namespace
- [ ] Update `pages/cineforum/[cineforumId]/oscars.tsx`:
  - [ ] Replace page content
  - [ ] Test oscars functionality
- [ ] Update `components/cineforum/oscars/OscarsRoundCard.tsx`:
  - [ ] Replace card strings

---

## Phase 4: Admin & Advanced Features

### 4.1 Admin Panel Translations

- [ ] Create `locales/it/admin.json` with:
  - [ ] User management strings
  - [ ] Team management strings
  - [ ] Round management strings
  - [ ] Proposal management strings
  - [ ] Form labels
  - [ ] Action buttons
  - [ ] Confirmation messages
- [ ] Create corresponding `locales/en/admin.json`

### 4.2 Admin Users Page

- [ ] Update `pages/cineforum/[cineforumId]/admin/users.tsx`:
  - [ ] Import `useTranslation('admin')`
  - [ ] Replace user management strings
  - [ ] Replace form labels
  - [ ] Replace action buttons
  - [ ] Test user creation
  - [ ] Test user editing
  - [ ] Test user deletion

### 4.3 Admin Teams Page

- [ ] Update `pages/cineforum/[cineforumId]/admin/teams.tsx`:
  - [ ] Replace team management strings
  - [ ] Replace form labels
  - [ ] Test team creation
  - [ ] Test team editing

### 4.4 Admin Rounds Page

- [ ] Update `pages/cineforum/[cineforumId]/admin/rounds.tsx`:
  - [ ] Replace round management strings
  - [ ] Replace form labels
  - [ ] Test round creation
  - [ ] Test round closing

### 4.5 Admin Proposals Page

- [ ] Update `pages/cineforum/[cineforumId]/admin/proposals.tsx`:
  - [ ] Replace proposal management strings
  - [ ] Replace action buttons
  - [ ] Test proposal editing
  - [ ] Test proposal closing/reopening

---

## Phase 5: Polish & Optimization

### 5.1 Validation Messages

- [ ] Create `locales/it/validation.json` with:
  - [ ] Required field messages
  - [ ] Format validation messages
  - [ ] Min/max length messages
  - [ ] Custom validation messages
- [ ] Create corresponding `locales/en/validation.json`
- [ ] Update all forms to use validation translations
- [ ] Test form validation in both languages

### 5.2 Common Components

- [ ] Update `components/cineforum/common/EmptyState.tsx`:
  - [ ] Make title and subtitle translatable
  - [ ] Test empty states across app
- [ ] Update `components/cineforum/common/LoadingCard.tsx`:
  - [ ] Make loading text translatable
  - [ ] Test loading states

### 5.3 Date & Time Formatting

- [ ] Create utility function for date formatting:

  ```typescript
  // lib/utils/date.ts
  import { format } from "date-fns";
  import { it, enUS } from "date-fns/locale";

  export function formatDate(date: Date, formatStr: string, language: string) {
    const locale = language === "it" ? it : enUS;
    return format(date, formatStr, { locale });
  }
  ```

- [ ] Replace all date formatting calls
- [ ] Test date display in both languages

### 5.4 Number Formatting

- [ ] Create utility function for number formatting:
  ```typescript
  // lib/utils/number.ts
  export function formatNumber(num: number, language: string, decimals = 1) {
    return new Intl.NumberFormat(language, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  }
  ```
- [ ] Replace all number formatting calls (ratings, scores, etc.)
- [ ] Test number display in both languages

### 5.5 Dynamic Meta Tags

- [ ] Update `pages/_app.tsx` to use translated meta tags:
  - [ ] Use `useTranslation` hook
  - [ ] Update title dynamically
  - [ ] Update description dynamically
  - [ ] Update og:locale based on current language
- [ ] Test meta tags in both languages

### 5.6 Profile Page

- [ ] Add profile strings to appropriate namespace
- [ ] Update `pages/profile.tsx`:
  - [ ] Replace form labels
  - [ ] Replace button text
  - [ ] Test profile editing

### 5.7 Error Pages (if any)

- [ ] Create error page translations
- [ ] Update 404 page (if exists)
- [ ] Update 500 page (if exists)

---

## Phase 6: Testing & Quality Assurance

### 6.1 Translation Completeness

- [ ] Verify all Italian translations are complete
- [ ] Verify all English translations are complete
- [ ] Check for missing translation keys (check console)
- [ ] Verify no hardcoded strings remain

### 6.2 Functional Testing

- [ ] Test language switcher on every page
- [ ] Test localStorage persistence
- [ ] Test browser language detection (clear localStorage and test)
- [ ] Test all forms in both languages
- [ ] Test all validation messages
- [ ] Test all error messages
- [ ] Test all success messages
- [ ] Test all empty states
- [ ] Test all loading states

### 6.3 Visual Testing

- [ ] Check text overflow in both languages
- [ ] Check button sizes accommodate both languages
- [ ] Check responsive design in both languages
- [ ] Check mobile view in both languages
- [ ] Verify no layout breaks

### 6.4 User Flow Testing

- [ ] Complete signup flow in Italian
- [ ] Complete signup flow in English
- [ ] Create cineforum in Italian
- [ ] Create cineforum in English
- [ ] Create proposal in Italian
- [ ] Create proposal in English
- [ ] Vote on proposal in Italian
- [ ] Vote on proposal in English
- [ ] View rankings in Italian
- [ ] View rankings in English
- [ ] Admin operations in Italian
- [ ] Admin operations in English

### 6.5 Performance Testing

- [ ] Measure initial load time
- [ ] Measure language switch time
- [ ] Check bundle size increase
- [ ] Verify no memory leaks on language switch

### 6.6 Translation Quality Review

- [ ] Native English speaker review of all English translations
- [ ] Check terminology consistency
- [ ] Create glossary of domain-specific terms
- [ ] Fix any awkward translations

---

## Phase 7: Documentation & Deployment

### 7.1 Developer Documentation

- [ ] Create `docs/I18N.md` with:
  - [ ] How to add new translations
  - [ ] How to use translations in components
  - [ ] Naming conventions for translation keys
  - [ ] How to test translations
- [ ] Update `README.md` with i18n information
- [ ] Document language switcher usage

### 7.2 Translation Glossary

- [ ] Create `docs/TRANSLATION_GLOSSARY.md` with:
  - [ ] Domain-specific terms (cineforum, proposal, round, etc.)
  - [ ] Consistent translations for common terms
  - [ ] Context for ambiguous terms

### 7.3 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] All translations complete
- [ ] Performance acceptable
- [ ] Code review completed
- [ ] Documentation updated

### 7.4 Deployment

- [ ] Deploy to staging environment
- [ ] Test on staging in both languages
- [ ] Get user feedback
- [ ] Fix any issues
- [ ] Deploy to production
- [ ] Monitor for errors

### 7.5 Post-Deployment

- [ ] Monitor user language preferences
- [ ] Collect feedback on translations
- [ ] Track any translation-related bugs
- [ ] Plan improvements based on feedback

---

## Future Enhancements (Optional)

### Database User Preference

- [ ] Add `preferredLanguage` field to User model in Prisma schema
- [ ] Create migration
- [ ] Add language preference to profile page
- [ ] Update `_app.tsx` to load user preference
- [ ] Override localStorage with database preference

### Additional Languages

- [ ] Create `locales/es/` for Spanish (if needed)
- [ ] Create `locales/fr/` for French (if needed)
- [ ] Update language switcher to support more languages
- [ ] Update i18n config with new languages

### Translation Management

- [ ] Evaluate translation management tools (Lokalise, Crowdin)
- [ ] Set up translation workflow
- [ ] Integrate with CI/CD

---

## Notes

### Translation Key Naming Convention

Use this pattern for consistency:

```
namespace:section.subsection.key
```

Examples:

- `common:buttons.save`
- `proposal:create.fields.title`
- `admin:users.actions.delete`

### Testing Tips

- Clear localStorage between tests: `localStorage.removeItem('i18nextLng')`
- Use browser DevTools to change language preference
- Test with different browser languages
- Use React DevTools to inspect i18n context

### Common Issues & Solutions

- **Flash of untranslated content**: Ensure i18n is initialized before app renders
- **Missing translations**: Check console for missing key warnings
- **Language not switching**: Check localStorage and i18n config
- **Wrong language on first load**: Check browser language detection config

---

## Completion Criteria

The i18n implementation is complete when:

- ✅ All pages display correctly in Italian and English
- ✅ Language switcher works on all pages
- ✅ Language preference persists across sessions
- ✅ Browser language detection works
- ✅ No hardcoded strings remain
- ✅ All translations reviewed by native speakers
- ✅ Performance impact is minimal
- ✅ Documentation is complete
- ✅ User feedback is positive
