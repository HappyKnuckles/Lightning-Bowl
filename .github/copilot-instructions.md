# Lightning Bowl - Bowling Score Tracker

Lightning Bowl is an Ionic Angular 18 mobile-first web application for tracking bowling games, statistics, and equipment. It supports PWA installation, mobile deployment via Capacitor 7, and is built as an **offline-first application** using IndexedDB for local data storage with seamless online/offline synchronization.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Build the Repository:

- **CRITICAL**: Node.js 20+ and npm 10+ are required (current: Node 20.19.4, npm 10.8.2)
- `npm install` -- takes 60+ seconds. NEVER CANCEL. Set timeout to 300+ seconds.
- `npm run build` -- takes 25+ seconds. NEVER CANCEL. Set timeout to 120+ seconds.
  - Builds to `www/` directory
  - Uses Angular 18 application builder
  - Produces ~1.8MB initial bundle + lazy chunks
  - Warnings about CommonJS modules (leaflet, exceljs) are expected
- `npm test` -- **CAUTION**: Tests have compilation errors and will fail. DO NOT run unless specifically fixing test issues.
  - Missing imports in `alley-map.page.spec.ts`
  - Constructor parameter issues in directive tests
  - Type mismatches in component tests
- `npm run lint` -- takes 4+ seconds. Returns warnings but succeeds (40+ TypeScript warnings about `any` types)
- `npm run stylelint` -- takes 2+ seconds. Returns 110+ style warnings but succeeds

### Run the Development Server:

- **Primary method**: `npm start` or `ng serve` -- serves on `http://localhost:4200/`
- **Alternative method**: `npx ionic serve` -- serves on `http://localhost:8100/`
- **NEVER CANCEL**: Development build takes 20+ seconds. Set timeout to 120+ seconds.
- Both methods work identically (Ionic CLI delegates to Angular CLI)

### Mobile Development:

- `npx cap sync` -- syncs web assets to native projects (takes 30+ seconds)
- `npx cap open android` -- opens Android Studio (requires Android SDK)
- `npx cap open ios` -- opens Xcode (requires macOS and Xcode)
- **Warning**: CocoaPods not installed - iOS builds will require pod install

## Validation

### ALWAYS run through complete user scenarios after making changes:

1. **Add Game Workflow**:

   - Navigate to Add tab (default)
   - Enter scores in bowling frame inputs (e.g., "9" and "1" for spare)
   - Verify automatic score calculation
   - Test Clear Score and Save Score buttons
   - Verify PWA install dialog appears and can be dismissed

2. **Navigation Testing**:

   - Test all 5 main tabs: New, Stats, History, Leagues, More
   - Stats tab shows "Start playing a few games to see your stats here!" when no data
   - All tabs should load without JavaScript errors

3. **PWA Functionality**:
   - PWA install banner appears automatically
   - Can be dismissed with Cancel button
   - Shows app screenshots and installation instructions

### Build and Test Validation:

- **ALWAYS build before committing**: `npm run build`
- **NEVER run unit tests** unless specifically fixing test infrastructure
- **ALWAYS run linting**: `npm run lint && npm run stylelint`
- Lint warnings are acceptable; lint errors must be fixed

### External API Dependencies:

- App integrates with 3 main external APIs (configured in `src/environments/environment.ts`):
  - **Bowwwl.com** (`https://bowwwl.com`) - Bowling ball images and product details
  - **Bowwwl Proxy** (`https://bowwwl-proxy.vercel.app/api/`) - Bowling ball data, specifications, and search
  - **Pattern Scraper** (`https://pattern-scraper.vercel.app/api/` in prod, `http://localhost:5000/api/` in dev) - Oil pattern data and analysis
- Additional services:
  - `https://va.vercel-scripts.com/` (Vercel analytics)
  - `https://bowling-ocr.vercel.app/api/server` (OCR processing)
- **Important**: Connection failures to these services are EXPECTED in development and do not indicate build problems
- The application gracefully handles offline scenarios with cached data fallbacks

## Common Tasks

### Key Directories and Files:

```
src/app/
├── core/                    # Services, models, constants, directives
│   ├── models/             # TypeScript interfaces (Game, Stats, Ball, etc.)
│   ├── services/           # Business logic services
│   └── constants/          # App constants and configurations
├── pages/                  # Main application pages (REQUIRED for new pages)
│   ├── add-game/          # Game entry form
│   ├── stats/             # Statistics display
│   ├── history/           # Game history
│   ├── balls/             # Bowling ball database
│   ├── arsenal/           # Personal ball collection
│   ├── pattern/           # Oil pattern analysis
│   ├── league/            # League management
│   ├── settings/          # App settings & themes
│   ├── minigame/          # Bowling mini-games
│   └── alley-map/         # Bowling alley map (uses Leaflet)
├── shared/                # Reusable components
│   └── components/        # UI components (prefix with data structure name)
└── tabs/                  # Tab navigation structure
    └── tabs.page.ts       # Main tabs + "More" modal configuration

Key Configuration Files:
- app.routes.ts            # Route definitions (REQUIRED for new pages)
- package.json             # Dependencies and scripts
- angular.json             # Angular build configuration
- ionic.config.json        # Ionic framework configuration
- capacitor.config.ts      # Mobile deployment configuration
- tsconfig.json            # TypeScript configuration
- src/environments/        # API endpoints and environment-specific settings
- src/theme/variables.scss # Color theme definitions (5 themes supported)
```

### Architecture Overview:

- **Framework**: Angular 18 + Ionic 8 + Capacitor 7
- **Routing**: Uses Ionic tabs with Angular Router (`app.routes.ts` - standalone routing, no modules)
- **Pages**: Lazy-loaded standalone components in `/pages/` directory
- **Navigation**: 5 main tabs (New, Stats, History, Leagues, More) + "More" modal with additional pages
- **Storage**: **Offline-First with IndexedDB** - Ionic Storage provides IndexedDB/SQLite with automatic online/offline sync
- **Charts**: Chart.js with zoom plugin
- **Maps**: Leaflet.js with marker clustering
- **Offline**: Service Worker with `ngsw-config.json` + comprehensive caching system
- **Build**: Angular application builder (not webpack)

### Key Technologies and Libraries:

- **UI Framework**: Ionic 8 with iOS/Android platform styling
- **State Management**: Angular services with signals (no NgRx)
- **Data Storage**: **IndexedDB-first architecture** with automatic cache management and network-aware synchronization
- **Data Visualization**: Chart.js for statistics charts
- **Excel Export**: ExcelJS for game history export
- **Maps**: Leaflet.js for bowling alley locations
- **PWA**: Angular Service Worker + custom install prompts
- **Mobile**: Capacitor plugins for device features (camera, haptics, geolocation)
- **Offline Support**: Comprehensive caching system with intelligent cache invalidation

### Working with the Codebase:

- **Component Updates**: Most UI is in `src/app/shared/components/`
- **Business Logic**: Core services in `src/app/core/services/`
- **Styling**: SCSS files use Ionic CSS variables and themes
- **Testing**: Limited test coverage; focus on manual testing
- **Linting**: ESLint for TypeScript, Stylelint for SCSS
- **Formatting**: Prettier with pre-commit hooks (Husky + lint-staged)

### Development Guidelines & Best Practices:

#### **New Page Creation:**

- **ALWAYS place new pages in the `src/app/pages/` directory**
- **MUST register new pages in two locations:**
  1. **Route Configuration**: Add lazy-loaded route in `src/app/app.routes.ts`
  2. **Tab Navigation**: Update `src/app/tabs/tabs.page.ts` for tab access (either main tabs or "More" modal)
- **Pages use Angular standalone components** with lazy loading via `loadComponent()`
- **Try to follow latest Angular and Ionic patterns** (signals, standalone components, tree-shaking imports)
- **Use Ionic components before you resort to custom HTML/CSS**

#### **Component Naming Convention:**

- **ALWAYS prefix components with the data structure they handle**
- **Examples:**
  - `ball-filter` - filters bowling ball data
  - `pattern-info` - displays oil pattern information
  - `game-filter` - filters game data
  - `league-selector` - handles league selection
- **Components go in `src/app/shared/components/[component-name]/`**
- **Use kebab-case for component names and folders**

#### **Design & Styling Requirements:**

- **ALWAYS examine existing app styles before creating new components**
- **MUST support all color themes defined in settings page:**
  - Red, Blue, Gray, Purple/Lila, Green (default)
  - Themes defined in `src/theme/variables.scss` using CSS custom properties
  - Managed by `ThemeChangerService` with automatic class application
- **Use Ionic CSS variables for theming (`--ion-color-primary`, `--ion-color-secondary`, etc.)**
- **Test component appearance across all color themes**
- **Follow existing component styling patterns from `src/app/shared/components/`**

#### **Code Safety & Architecture:**

- **ALWAYS follow Single Responsibility Principle** - one component, one purpose
- **NEVER delete or modify existing code unrelated to your specific issue**
- **Use Angular standalone components** (no NgModule declarations needed)
- **Import only required Ionic components** (tree-shaking optimization)
- **Follow existing service injection patterns** from `src/app/core/services/`

#### **Code Cleanup & Scope Management:**

- **ALWAYS clean up your code after making changes** - remove any bloat or unnecessary modifications
- **ONLY include necessary code to complete the issue** - avoid scope creep and unrelated changes
- **Remove temporary files, debug code, and unused imports** before committing
- **Revert any accidental changes** that don't directly address the specific issue
- **Keep changes surgical and minimal** - prefer small, targeted modifications over large refactors

#### **Example: Adding a New Page**

```typescript
// 1. Create page in src/app/pages/my-feature/my-feature.page.ts
@Component({
  selector: 'app-my-feature',
  templateUrl: './my-feature.page.html',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent]
})
export class MyFeaturePage {}

// 2. Add route in src/app/app.routes.ts
{
  path: 'my-feature',
  loadComponent: () => import('./pages/my-feature/my-feature.page').then(m => m.MyFeaturePage)
}

// 3. Add to tabs in src/app/tabs/tabs.page.ts (if needed in navigation)
readonly moreTabs = [..., '/tabs/my-feature'];
```

#### **Example: Adding a New Component**

```typescript
// Component name: ball-recommendations (handles ball data)
// Location: src/app/shared/components/ball-recommendations/

@Component({
  selector: "app-ball-recommendations",
  templateUrl: "./ball-recommendations.component.html",
  standalone: true,
  imports: [IonCard, IonButton, NgFor],
})
export class BallRecommendationsComponent {
  // Single responsibility: recommend bowling balls
}
```

### Development Tips:

- **Hot Reload**: Development server supports hot module replacement
- **Debug Mode**: Angular runs in development mode with detailed logging
- **Browser DevTools**: Use for debugging; check console for API failures
- **PWA Testing**: Test offline functionality with network throttling
- **Mobile Testing**: Use browser device emulation or deploy to device via Capacitor

### Performance Considerations:

- **Bundle Size**: Main bundle ~1.8MB with lazy loading for pages
- **Build Time**: Production builds take 25+ seconds
- **Memory Usage**: Large Angular + Ionic + Chart.js bundle
- **Offline Support**: Caches app shell and assets via service worker + IndexedDB for application data
- **Network Awareness**: Automatic online/offline detection with intelligent cache fallbacks

### Deployment:

- **Web**: Deploy `www/` directory after `npm run build`
- **Android**: Use `npx cap open android` after `npx cap sync`
- **iOS**: Use `npx cap open ios` after `npx cap sync` (requires macOS)
- **PWA**: Service worker handles caching and offline functionality

## Quick Reference

### Common Commands & Timing

```bash
# Development Setup
npm install                    # 60+ seconds, timeout: 300+
npm run build                  # 25+ seconds, timeout: 120+
npm start                      # 20+ seconds, timeout: 120+
npx ionic serve                # Alternative dev server
npm run lint                   # 4+ seconds
npm run stylelint              # 2+ seconds

# Mobile Development
npx cap sync                   # 30+ seconds
npx cap open android           # Opens Android Studio
npx cap open ios               # Opens Xcode (macOS only)

# Key Development URLs
http://localhost:4200/         # Angular dev server
http://localhost:8100/         # Ionic dev server
```

### File Structure Quick Access

```
src/app/
├── pages/                     # New pages go here (REQUIRED)
├── shared/components/         # Reusable components
├── core/services/            # Business logic
├── core/models/              # TypeScript interfaces
├── app.routes.ts             # Route registration (REQUIRED)
└── tabs/tabs.page.ts         # Tab navigation (REQUIRED)

Key Config Files:
├── src/environments/         # API endpoints & settings
├── src/theme/variables.scss  # Color themes (5 themes)
├── angular.json              # Build configuration
├── capacitor.config.ts       # Mobile deployment
└── .github/copilot-instructions.md
```

### Essential Validation Workflow

1. **Build**: `npm run build` (verify no errors)
2. **Test Navigation**: All 5 tabs (New, Stats, History, Leagues, More)
3. **Test Bowling Input**: Enter scores, verify auto-calculation
4. **Test PWA**: Install prompt appears and dismisses correctly
5. **Lint**: `npm run lint && npm run stylelint` (warnings OK)

## Code Patterns & Style Guide

Lightning Bowl follows **Angular 18 + Ionic 8** modern patterns with emphasis on **signals**, **standalone components**, and **offline-first architecture**.

### Angular Modern Patterns

#### **Dependency Injection**

```typescript
// ✅ Modern: inject() function
import { inject } from '@angular/core';
import { MyService } from './my.service';

@Component({...})
export class MyComponent {
  private myService = inject(MyService);
  private router = inject(Router);
}

// ✅ Traditional: Constructor injection (also used)
export class MyComponent {
  constructor(
    private myService: MyService,
    private router: Router
  ) {}
}
```

#### **Signals (Primary State Management)**

```typescript
import { signal, computed, effect } from "@angular/core";

@Injectable({ providedIn: "root" })
export class MyService {
  // Private signal
  #isLoading = signal<boolean>(false);

  // Public readonly getter
  get isLoading() {
    return this.#isLoading;
  }

  // Computed signals
  status = computed(() => (this.#isLoading() ? "Loading..." : "Ready"));

  setLoading(loading: boolean): void {
    this.#isLoading.set(loading);
  }
}
```

#### **Component Input Signals**

```typescript
@Component({...})
export class MyComponent {
  // Required input
  data = input.required<MyData>();

  // Optional input with default
  items = input<Item[]>([]);

  // Computed from inputs
  displayItems = computed(() => this.items().slice(0, 10));
}
```

#### **Modern Control Flow (Template)**

```html
<!-- ✅ Modern: @if, @for, @switch -->
@if (isLoading()) {
<ion-spinner></ion-spinner>
} @else {
<ion-list>
  @for (item of items(); track item.id) {
  <ion-item>{{ item.name }}</ion-item>
  } @empty {
  <ion-text>No items found</ion-text>
  }
</ion-list>
} @switch (status()) { @case ('loading') {
<ion-spinner></ion-spinner>
} @case ('error') {
<ion-text color="danger">Error occurred</ion-text>
} @default {
<ion-content>Ready</ion-content>
} }
```

### Ionic Standalone Component Pattern

#### **Component Structure**

```typescript
import { Component } from "@angular/core";
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonCard } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { heart, star } from "ionicons/icons";

@Component({
  selector: "app-my-component",
  templateUrl: "./my-component.component.html",
  styleUrls: ["./my-component.component.scss"],
  standalone: true,
  imports: [
    // Import only required Ionic components
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    // Angular common
    NgIf,
    NgFor,
    DatePipe,
  ],
})
export class MyComponent {
  constructor() {
    // Register only required icons
    addIcons({ heart, star });
  }
}
```

#### **Service Integration**

```typescript
@Component({...})
export class MyComponent {
  // Inject signals-based services
  private loadingService = inject(LoadingService);
  private gameService = inject(GameService);

  // Access signals
  isLoading = this.loadingService.isLoading;

  // Use computed for derived state
  canSave = computed(() =>
    !this.isLoading() && this.form.valid
  );
}
```

### Theme & Styling Patterns

#### **Multi-Theme Support**

```scss
// Use CSS custom properties from theme
.my-component {
  background: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);
  border: 1px solid var(--ion-color-medium);
}

// Support all 5 themes automatically
.my-button {
  --background: var(--ion-color-secondary);
  --color: var(--ion-color-secondary-contrast);
}
```

#### **Component Naming Convention**

```typescript
// ✅ Prefix with data structure
ball - filter.component.ts; // Handles Ball data
pattern - info.component.ts; // Displays Pattern information
game - stats.component.ts; // Shows Game statistics
league - selector.component.ts; // Selects League data
```

### Page Creation Pattern

#### **1. Create in pages/ folder**

```bash
src/app/pages/my-feature/
├── my-feature.page.ts
├── my-feature.page.html
├── my-feature.page.scss
└── my-feature.page.spec.ts
```

#### **2. Register route (app.routes.ts)**

```typescript
export const routes: Routes = [
  // ... existing routes
  {
    path: "my-feature",
    loadComponent: () => import("./pages/my-feature/my-feature.page").then((m) => m.MyFeaturePage),
  },
];
```

#### **3. Add to tabs navigation (tabs.page.ts)**

```typescript
export class TabsPage {
  // For main tabs (replace existing)
  readonly tabs = [
    { title: "New", url: "/tabs/add-game", icon: "add" },
    { title: "My Feature", url: "/tabs/my-feature", icon: "star" },
  ];

  // For "More" modal tabs
  readonly moreTabs = [
    // ... existing tabs
    "/tabs/my-feature",
  ];
}
```

### IndexedDB & Offline Patterns

#### **Service Pattern**

```typescript
@Injectable({ providedIn: "root" })
export class DataService {
  private storage = inject(StorageService);
  private network = inject(NetworkService);

  // Signal for offline-first data
  #data = signal<MyData[]>([]);

  async loadData(): Promise<void> {
    // Always try local first
    const localData = await this.storage.get("myData");
    this.#data.set(localData || []);

    // Then sync with API if online
    if (this.network.isOnline()) {
      try {
        const apiData = await this.fetchFromApi();
        await this.storage.set("myData", apiData);
        this.#data.set(apiData);
      } catch {
        // Graceful fallback to cached data
        console.log("Using cached data");
      }
    }
  }
}
```

## Critical Reminders:

- **NEVER CANCEL builds or long-running commands** - they may take 60+ seconds
- **ALWAYS manually test after changes** - automated tests are not reliable
- **API failures are expected** - external services may be unreachable
- **Lint warnings are acceptable** - focus on functionality over perfect linting
- **PWA features work offline** - test with network disabled
- **Mobile deployment requires platform-specific tooling** (Android SDK, Xcode)
- **IndexedDB and caching** - Application prioritizes offline functionality with automatic sync when online
