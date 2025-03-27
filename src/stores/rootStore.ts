import { AuthStore } from './authStore';

export class RootStore {
  authStore: AuthStore;

  constructor() {
    this.authStore = new AuthStore();
  }
}

let store: RootStore;

export function initializeStore() {
  const _store = store ?? new RootStore();
  // For SSR: always create a new store
  if (typeof window === "undefined") return _store;
  // For CSR: reuse store
  if (!store) store = _store;

  return _store;
}