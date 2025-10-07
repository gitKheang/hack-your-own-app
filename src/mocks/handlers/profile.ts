import type { SettingsStore } from "../store";

const API_BASE = "/api";

const randomDelay = (delay: (duration?: number) => Promise<void>) =>
  delay(150 + Math.random() * 450);

type RequestContext = {
  request: Request;
};

export const createProfileHandlers = ({
  http,
  delay,
  HttpResponse,
  store,
  utils,
}: {
  http: typeof import("msw").http;
  delay: typeof import("msw").delay;
  HttpResponse: typeof import("msw").HttpResponse;
  store: SettingsStore;
  utils: {
    createOtpCode: () => string;
    revokeAllSessions: () => void;
    revokeSession: (id: string) => void;
  };
}) => {
  const { createOtpCode, revokeAllSessions, revokeSession } = utils;

  return [
    http.get(`${API_BASE}/me`, async () => {
      await randomDelay(delay);
      return HttpResponse.json(store.profile);
    }),

    http.put(`${API_BASE}/me`, async ({ request }: RequestContext) => {
      await randomDelay(delay);
      const body = await request.json();

      store.profile = {
        ...store.profile,
        ...body,
        email_verified: store.profile.email_verified,
        email: store.profile.email,
      };

      return HttpResponse.json(store.profile);
    }),

    http.post(`${API_BASE}/auth/change-email`, async ({ request }: RequestContext) => {
      await randomDelay(delay);
      const body = await request.json();

      if (!body?.email) {
        return HttpResponse.json({ message: "Email is required" }, { status: 400 });
      }

      if (String(body.email).toLowerCase() === store.profile.email.toLowerCase()) {
        return HttpResponse.json(
          { message: "New email must be different from the current one." },
          { status: 400 },
        );
      }

      const code = createOtpCode();
      store.pendingEmailChange = { email: body.email, code };
      store.profile = { ...store.profile, email_verified: false };

      console.info(`[MSW] Email verification code for ${body.email}: ${code}`);

      return HttpResponse.json({ email: body.email });
    }),

    http.post(`${API_BASE}/auth/verify-email`, async ({ request }: RequestContext) => {
      await randomDelay(delay);
      const body = await request.json();

      if (!body?.email || !body?.code) {
        return HttpResponse.json(
          { message: "Email and code are required." },
          { status: 400 },
        );
      }

      const pending = store.pendingEmailChange;

      if (pending) {
        if (pending.email.toLowerCase() !== String(body.email).toLowerCase()) {
          return HttpResponse.json(
            { message: "No verification pending for this email." },
            { status: 400 },
          );
        }

        if (pending.code !== body.code) {
          return HttpResponse.json({ message: "Invalid verification code." }, { status: 400 });
        }

        store.profile = {
          ...store.profile,
          email: pending.email,
          email_verified: true,
        };

        store.pendingEmailChange = null;
        return HttpResponse.json(store.profile);
      }

      if (store.profile.email.toLowerCase() !== String(body.email).toLowerCase()) {
        return HttpResponse.json(
          { message: "Email is already verified or does not match." },
          { status: 400 },
        );
      }

      if (store.profile.email_verified) {
        return HttpResponse.json(
          { message: "Email is already verified." },
          { status: 400 },
        );
      }

      return HttpResponse.json(store.profile);
    }),

    http.post(`${API_BASE}/auth/change-password`, async ({ request }: RequestContext) => {
      await randomDelay(delay);
      const body = await request.json();

      if (!body?.current || !body?.next) {
        return HttpResponse.json(
          { message: "Current and new passwords are required." },
          { status: 400 },
        );
      }

      if (body.current !== store.password) {
        return HttpResponse.json({ message: "Current password is incorrect." }, { status: 400 });
      }

      store.password = body.next;

      return HttpResponse.json({ ok: true });
    }),

    http.post(`${API_BASE}/auth/resend-verification`, async () => {
      await randomDelay(delay);

      const code = createOtpCode();
      store.pendingEmailChange = {
        email: store.profile.email,
        code,
      };
      store.profile = {
        ...store.profile,
        email_verified: false,
      };

      console.info(`[MSW] Resent verification code for ${store.profile.email}: ${code}`);

      return HttpResponse.json({ ok: true });
    }),

    http.post(`${API_BASE}/auth/logout`, async () => {
      await randomDelay(delay);
      revokeAllSessions();
      return HttpResponse.json({ ok: true });
    }),

    http.get(`${API_BASE}/me/sessions`, async () => {
      await randomDelay(delay);
      return HttpResponse.json(store.sessions);
    }),

    http.post(`${API_BASE}/me/sessions/revoke`, async ({ request }: RequestContext) => {
      await randomDelay(delay);
      const body = await request.json();
      if (!body?.id) {
        return HttpResponse.json({ message: "Session id is required." }, { status: 400 });
      }
      revokeSession(body.id);
      return HttpResponse.json({ ok: true });
    }),

    http.post(`${API_BASE}/me/sessions/revoke-all`, async () => {
      await randomDelay(delay);
      revokeAllSessions();
      return HttpResponse.json({ ok: true });
    }),
  ];
};
