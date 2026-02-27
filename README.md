# Onera — Where connection unfolds

Premium relationship experience app focused on intentional, structured conversations.

## Key Features
- Personalized relationship profiles that tune tone and progression.
- Dynamic session logic that adapts question flow by mood, pacing, and emotional safety.
- Swipe-first interaction for smooth, low-friction conversation turns.
- Adaptive progression across warmup, curiosity, deep, vulnerable, intimate, and relief phases.
- Custom session engine with deterministic progression boundaries and summary output.
- Local persistence for preferences, profile setup, favorites, and session continuity.
- Favorites workflow for bookmarking meaningful prompts.
- Profile avatars and role-aware visual theming.
- Bilingual GR/EN experience via an i18n layer.
- Premium-ready architecture with explicit premium gates and extendable deck controls.
- Scalable structure for future monetization and content expansion.

## Tech Stack
- React Native (Expo)
- TypeScript
- Zustand state management
- React Navigation (native stack)
- AsyncStorage local persistence
- i18next + react-i18next + expo-localization (GR/EN internationalization)
- Expo Haptics + Expo Image Picker

## Architecture Overview
Onera is structured with clear boundaries between presentation and decision logic:

- **UI layer (`src/components`, `src/screens`)** handles rendering, interaction, and navigation.
- **Session/domain layer (`src/application`, `src/domain`, `src/engine`)** owns progression, emotional-state transitions, and question selection rules.
- **Typed models (`src/types`, domain types)** keep core entities (profiles, questions, session state) explicit and safer to evolve.
- **State orchestration (`src/state`)** uses lightweight stores as the app-facing integration layer.
- **Persistence/infrastructure (`src/infrastructure/persistence`)** encapsulates local session memory behavior.
- **i18n layer (`src/i18n`)** centralizes translation resources and locale bootstrapping.

The current codebase primarily uses typed stores and service objects rather than a separate custom-hooks layer, which keeps business rules centralized and testable.

## Session Engine
The session engine is designed to feel adaptive while remaining predictable in outcomes:

- **Authoritative timer:** a central timer value drives session termination, ensuring sessions end consistently when time is up.
- **Deterministic completion paths:** sessions complete through explicit reasons (time up, deck exhausted, or user ended), then produce a structured summary.
- **Progression rules:** phase and intensity evolve from mood/profile constraints, safety level, skips/favorites signals, and bounded intensity logic.
- **State isolation:** engine/domain objects compute progression, while stores coordinate app state updates and screen-level consumption.

This keeps runtime behavior stable and understandable without overstating “AI” capabilities.

## Folder Structure
```text
src/
  application/
  components/
  data/
  domain/
  engine/
  i18n/
  infrastructure/
  screens/
  state/
  theme/
  types/
  utils/
```

## Screenshots / Demo
Planned screenshot slots:
- `/assets/screenshots/1-home.png`
- `/assets/screenshots/2-session.png`
- `/assets/screenshots/3-favorites.png`
- `/assets/screenshots/4-profile.png`

(Directory scaffold is included so screenshots can be dropped in directly.)

## Roadmap
- **V1/V2:** continue refining local-first session logic, deck quality, and UX polish.
- **V3:** backend introduction for accounts, sync, and remote content delivery.
- **Monetization readiness:** extend premium gating and content packaging for payments/subscriptions.

## Getting Started
```bash
npm install
npx expo start
```

Optional:
```bash
npm run android
npm run ios
```

No additional environment variables are required for the current local-first setup.

## License + Contact
- **License:** Add your preferred license file (e.g., MIT) at the repository root.
- **Contact:** For collaboration or recruiting inquiries, open an issue or contact the maintainer directly.

---
**GitHub description suggestion:** Onera is a premium-ready Expo + TypeScript relationship app focused on intentional, structured conversations with a robust local session engine.
