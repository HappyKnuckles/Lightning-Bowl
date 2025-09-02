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
├── pages/                  # Main application pages
│   ├── add-game/          # Game entry form
│   ├── stats/             # Statistics display
│   ├── history/           # Game history
│   └── alley-map/         # Bowling alley map (uses Leaflet)
├── shared/                # Reusable components
│   └── components/        # UI components
└── tabs/                  # Tab navigation structure

Key Configuration Files:
- package.json             # Dependencies and scripts
- angular.json             # Angular build configuration
- ionic.config.json        # Ionic framework configuration  
- capacitor.config.ts      # Mobile deployment configuration
- tsconfig.json            # TypeScript configuration
- src/environments/        # API endpoints and environment-specific settings
```

### Architecture Overview:
- **Framework**: Angular 18 + Ionic 8 + Capacitor 7
- **Routing**: Uses Ionic tabs with Angular Router
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

## Critical Reminders:
- **NEVER CANCEL builds or long-running commands** - they may take 60+ seconds
- **ALWAYS manually test after changes** - automated tests are not reliable
- **API failures are expected** - external services may be unreachable
- **Lint warnings are acceptable** - focus on functionality over perfect linting
- **PWA features work offline** - test with network disabled
- **Mobile deployment requires platform-specific tooling** (Android SDK, Xcode)
- **IndexedDB and caching** - Application prioritizes offline functionality with automatic sync when online