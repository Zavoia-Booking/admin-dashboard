declare module '*.css';
declare module '*.svg' {
  const src: string;
  export default src;
}

// Eruda debug console
declare module 'eruda' {
  const eruda: {
    init: () => void;
  };
  export default eruda;
}

// Fontsource packages are CSS-only (side-effect imports load @font-face rules
// and bundle the woff2 files via Vite's JS pipeline). They ship no .d.ts, so
// declare the modules here for tsc -b strict resolution.
declare module '@fontsource-variable/geist';
declare module '@fontsource-variable/geist-mono';
