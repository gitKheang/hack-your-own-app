import {
  settingsStore,
  createOtpCode,
  revokeAllSessions,
  revokeSession,
} from "../store";
import { createDomainHandlers } from "./domains";
import { createProfileHandlers } from "./profile";
import { createSettingsHandlers } from "../settings";

export const createHandlers = (msw: typeof import("msw")) => {
  const shared = {
    http: msw.http,
    delay: msw.delay,
    HttpResponse: msw.HttpResponse,
  };

  return [
    ...createProfileHandlers({
      ...shared,
      store: settingsStore,
      utils: {
        createOtpCode,
        revokeAllSessions,
        revokeSession,
      },
    }),
    ...createSettingsHandlers(shared),
    ...createDomainHandlers(shared),
  ];
};
