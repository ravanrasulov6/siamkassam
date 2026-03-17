# Project Setup & Development Guidelines

Welcome to the Siam Kassam project documentation. This document outlines the development system, coding standards, architecture, and best practices used throughout the application.

---

## 1. Project Overview

*   **Purpose:** A modern, high-performance business management system designed to handle inventory, expenses, debts, and AI-assisted data entry (Siam Köməkçi).
*   **Tech Stack:**
    *   **Frontend Library:** React.js (Vite)
    *   **Routing:** React Router DOM
    *   **State Management:** React Context API & Local State
    *   **Backend / Database:** Supabase (PostgreSQL, Auth, Storage)
    *   **Styling:** Pure CSS with CSS Variables & Glassmorphism Aesthetics
    *   **Icons:** Lucide React / React Feather
*   **Future Scalability (Flutter Migration Consideration):**
    This web application is designed with a potential future migration to a desktop and mobile application using Flutter. To support this, business logic is explicitly separated from UI components. API service layers and modularized styling make transposing the application's structure to Dart/Flutter significantly easier.

---

## 2. Project Structure

The codebase follows a feature-first, modular architecture to promote separation of concerns.

```text
src/
├── assets/          # Static files (images, fonts)
├── components/      # Reusable and isolated UI components
│   ├── dashboard/   # Dashboard specific components (KPICard, Charts)
│   ├── layout/      # App layout (Sidebar, Header, Layout Wrappers)
│   └── ui/          # Generic UI elements (Modal, DataTable, GlassCard)
├── context/         # Global State Management (AuthContext, ToastContext)
├── hooks/           # Custom reusable React hooks (useCustomers, useDebounce)
├── lib/             # Third-party configuration (supabase.js)
├── pages/           # Page routes (grouped by feature)
│   ├── ai/          # AI Hub feature
│   ├── auth/        # Login/Register pages
│   ├── debts/       # Debts management feature
│   └── ...
├── services/        # API communication layer (business logic separation)
└── styles/          # Global styles, variables, and component stylesheets
```

**Separation of Concerns:**
*   **Pages:** Act as containers. They fetch data via hooks/services and pass it down to components.
*   **Components:** Pure, presentation-focused UI elements. They receive props and dispatch events.
*   **Services:** All Supabase interactions and data formatting happen here. No UI logic should exist in the services.
*   **Hooks:** Encapsulate complex state logic and lifecycle effects.

---

## 3. Coding Standards

*   **Naming Conventions:**
    *   **Files:** PascalCase for React components (`DebtsPage.jsx`, `Modal.jsx`). camelCase for utility and service files (`auth.service.js`, `formatUtils.js`).
    *   **Variables/Functions:** camelCase (`handleLogin`, `userData`).
    *   **Constants:** UPPER_SNAKE_CASE (`MAX_UPLOAD_SIZE`, `API_ENDPOINTS`).
    *   **Components:** PascalCase (`<GlassCard />`).
*   **Clean Code Principles:**
    *   Keep functions small and focused on a single responsibility (SOLID).
    *   Use descriptive variable names. Avoid abbreviations like `c` for customer unless in a very tight loop (e.g., `customers.map(c => ...)`).
    *   Comment the "why", not the "what". The code should explain what is happening.
*   **Reusable Component Design Rules:**
    *   Components should not fetch their own data unless they are a complex, self-contained widget.
    *   Rely on `children` and generic props (`className`, `style`) to allow flexibility.

---

## 4. State Management

*   **Context API:** Used for genuinely global, infrequently changing state.
    *   `AuthContext`: User session, session verification, and business context layer.
    *   `ToastContext`: Global notification system.
*   **Local State (`useState` / `useReducer`):** Used for component-specific state (form inputs, toggle switches, local loading spinners).
*   **Why Not Redux/Zustand?** The application currently relies heavily on remote server state (Supabase). For our current complexity, Context API + Custom Hooks (`useCustomers`, `useProducts`) is sufficient and keeps the bundle size small. If client-side caching requirements grow complex, a tool like React Query (@tanstack/react-query) is preferred over Redux.

---

## 5. API Handling

*   **API Layer Structure:** All database and external API calls are centralized in the `src/services/` directory. For example, `debts.service.js` handles all RPC calls, inserts, and updates for debts.
*   **Error Handling:** Services throw standard Javascript `Error` objects. The UI layer (pages/components) catches these errors and displays them using the `ToastContext` (`showError(err.message)`).
*   **Loading States:** Custom hooks and pages maintain a `loading` boolean state. This is used to display skeleton loaders or spinners, ensuring a smooth UX rather than abrupt UI shifts.

---

## 6. UI/UX Guidelines

*   **Design Consistency:** The app uses a "Premium White Glassmorphism" aesthetic. Heavy use of translucency, smooth shadows (`box-shadow`), and rounded corners (`border-radius: var(--radius-2xl)`).
*   **Responsiveness:**
    *   Mobile-first consideration.
    *   Use of unified CSS variables (`--space-*`, `--font-*`) for consistency.
    *   Heavy use of CSS Grid (`grid-template-columns: repeat(auto-fit, minmax(...))`) for fluid layouts.
    *   Specific mobile breakpoints (`@media (max-width: 768px)`) adapt layouts (e.g., bottom-sheet modals instead of centered dialogs, edge-to-edge chat layouts).
*   **Accessibility Basics:**
    *   Use semantic HTML (`<button>`, `<nav>`, `<main>`).
    *    Maintain sufficient color contrast, particularly on text atop glassmorphism panels.

---

## 7. Performance Optimization

*   **Debouncing:** Heavy operations, such as search filtering across large arrays in `useCustomers`, are debounced (e.g., 300ms) to prevent UI thread blocking on mobile.
*   **Lazy Loading:** Large route components and heavy internal UI blocks (like the `ReceivablesTab` and `PayablesTab` on the Debts page) are lazy-loaded via `React.lazy()` and `<Suspense>` to improve the First Contentful Paint.
*   **Animation Throttling:** The app respects user system settings. Heavy CSS animations and blur effects are disabled using `@media (prefers-reduced-motion: reduce)` to support low-end devices and save battery.
*   **Hardware Acceleration:** Expensive UI transitions utilize `transform: translateZ(0)` to force GPU rendering and reduce frame drops.

---

## 8. Environment Setup

*   **Required Tools:** Node.js (v18+), npm/yarn/pnpm, Git.
*   **Installation Steps:**
    1.  `git clone <repository_url>`
    2.  `cd siamkassam`
    3.  `npm install`
    4.  Copy `.env.example` to `.env` and fill in credentials.
    5.  `npm run dev`
*   **Environment Variables:**
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

---

## 9. Git Workflow

*   **Branching Strategy:**
    *   `main`: Production-ready code.
    *   `development` (optional): Integration branch.
    *   `feature/*` or `fix/*`: Used for developing specific features or fixing bugs (e.g., `feature/ai-voice-input`).
*   **Commit Message Conventions:** Use imperative mood.
    *   `feat: add intelligent debt parsing`
    *   `fix: resolve mobile scrolling issue on Safari`
    *   `style: implement glassmorphism on dashboard`
    *   `perf: debounce customer search input`
*   **Code Review Rules:** Ensure responsive layout works on both Desktop and Mobile views before pushing.

---

## 10. Testing Strategy

*(Future Implementation Phase)*
*   **Unit Testing:** `Vitest` and `React Testing Library`. Used to test pure functions in `services/` and visual correctness of isolated components in `components/ui/`.
*   **Integration Testing:** Verify flows such as Authentication, Debt Creation, and App Routing.
*   **Manual Testing Checklists:** Focus heavily on cross-device functionality (iOS Safari vs Android Chrome) due to glassmorphism rendering quirks.

---

## 11. Preparation for Flutter Migration

To ensure a smooth transition to a Flutter desktop/mobile app in the future:
*   **Strict Logic Separation:** The `src/services/` logic maps perfectly to Dart Repositories/Services. Keep React component files free of complex database queries.
*   **API-First Design:** Treat the Supabase database as a headless backend. The Flutter app will consume the exact same database rules, RLS policies, and RPC functions.
*   **State Abstraction:** The current Context/Hook approach in React translates well to Provider/Riverpod in Flutter. Ensure state is logically grouped (e.g., Auth, Theme, Business Context).
*   **Semantic UI Construction:** React layouts using standard flexbox/grid mimic Flutter's `Row`, `Column`, and `GridView`. Keeping the UI component tree shallow and compositional in React will make porting to Flutter Widgets easier.

---

## 12. Best Practices & Anti-Patterns

**Do's:**
*   Always use the centralized `showSuccess`/`showError` toast context for user feedback.
*   Use CSS variables defined in `index.css` for all colors, spacing, and font sizes to maintain brand identity.
*   Gracefully handle loading states (`isLoading`) and empty states (no data returned).

**Anti-Patterns (Avoid):**
*   **Inline styles for layout:** Avoid writing large `style={{ ... }}` blocks for complex layouts; use CSS classes.
*   **Prop Drilling:** Do not pass props down more than 2-3 levels. If a prop is needed deeply, consider Context API or component composition.
*   **Direct DOM manipulation:** Avoid `document.getElementById` or `querySelector`. Use React `useRef` if direct node access is absolutely necessary.
*   **God Components:** If a file exceeds 400 lines (with exceptions for highly complex single-view screens), consider breaking it down into smaller sub-components.
