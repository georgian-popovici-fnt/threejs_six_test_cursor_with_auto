# Space Modeller - Configuration Summary

This Angular 18 application has been configured with the following settings:

## Project Details
- **Name**: space-modeller
- **Angular Version**: 18.2.x
- **TypeScript Version**: 5.5.2

## Key Configurations

### 1. Standalone Components
- The application uses Angular standalone components (no NgModules required)
- All components are configured to be standalone by default in `angular.json`

### 2. Routing
- Angular Router is enabled
- Routes are defined in `src/app/app.routes.ts`
- Router configuration is provided in `src/app/app.config.ts`

### 3. TypeScript Configuration
- **Strict Mode**: Enabled
- **noImplicitAny**: Explicitly enabled (no 'any' types allowed)
- Additional strict flags enabled:
  - `noImplicitOverride`
  - `noPropertyAccessFromIndexSignature`
  - `noImplicitReturns`
  - `noFallthroughCasesInSwitch`

### 4. Change Detection Strategy
- **Default Change Detection**: OnPush
- All new components generated with Angular CLI will automatically use `ChangeDetectionStrategy.OnPush`
- The root `AppComponent` has been updated to use OnPush

## Schematics Configuration

The following defaults are configured in `angular.json`:

```json
"schematics": {
  "@schematics/angular:component": {
    "changeDetection": "OnPush",
    "style": "css",
    "standalone": true
  }
}
```

## Getting Started

### Install dependencies (if not already done)
```bash
cd space-modeller
npm install
```

### Run the development server
```bash
npm start
```

The app will be available at `http://localhost:4200/`

### Generate a new component
```bash
ng generate component my-component
```

This will automatically create a standalone component with OnPush change detection.

### Build for production
```bash
npm run build
```

## Project Structure
```
space-modeller/
├── src/
│   ├── app/
│   │   ├── app.component.ts       # Root component (OnPush)
│   │   ├── app.component.html
│   │   ├── app.component.css
│   │   ├── app.config.ts          # Application configuration
│   │   └── app.routes.ts          # Route definitions
│   ├── main.ts                    # Application bootstrap
│   ├── index.html
│   └── styles.css
├── angular.json                   # Angular CLI configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json
```

