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
