declare module "msw/browser" {
  type StartOptions = {
    onUnhandledRequest?: "bypass" | "warn" | "error";
    serviceWorker?: {
      url?: string;
      options?: RegistrationOptions;
    };
  };

  type MockServiceWorker = {
    start: (options?: StartOptions) => Promise<void>;
    stop: () => void;
  };

  export const setupWorker: (...handlers: Array<unknown>) => MockServiceWorker;
}
