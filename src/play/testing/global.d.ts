import type { TestBridge } from './TestBridge';

declare global {
  interface Window {
    __nitrokatsTest?: TestBridge;
  }
}

export {};
