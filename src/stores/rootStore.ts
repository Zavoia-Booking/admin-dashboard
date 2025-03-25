import { UserStore } from './userStore';

export class RootStore {
  userStore: UserStore;

  constructor() {
    this.userStore = new UserStore();
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