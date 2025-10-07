import { setupWorker } from "msw/browser";
import * as mswCore from "msw";

const HANDLER_MODULE = () => import("./handlers");

export const startMockWorker = async () => {
  if (typeof window === "undefined" || !("navigator" in window)) {
    return null;
  }

  try {
    const [{ createHandlers }] = await Promise.all([HANDLER_MODULE()]);

    const handlers = createHandlers(mswCore);
    const worker = setupWorker(...handlers);
    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: {
        url: "/mockServiceWorker.js",
      },
    });

    console.info("[MSW] Mock Service Worker enabled.");
    return worker;
  } catch (error) {
    console.warn(
      "[MSW] Unable to start Mock Service Worker. Proceeding without mocks.",
      error,
    );
    return null;
  }
};
