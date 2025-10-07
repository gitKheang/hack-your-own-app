import { ApiError } from "@/api/client";
import { listDomainsMock, verifyDomainMock } from "../domains-mock-api";

const API_BASE = "/api";

const randomDelay = (delay: (duration?: number) => Promise<void>) =>
  delay(150 + Math.random() * 450);

export const createDomainHandlers = ({
  http,
  delay,
  HttpResponse,
}: {
  http: typeof import("msw").http;
  delay: typeof import("msw").delay;
  HttpResponse: typeof import("msw").HttpResponse;
}) => [
  http.get(`${API_BASE}/domains`, async () => {
    await randomDelay(delay);
    const domains = await listDomainsMock();
    return HttpResponse.json(domains);
  }),
  http.post(`${API_BASE}/domains/verify`, async ({ request }: { request: Request }) => {
    await randomDelay(delay);
    const body = (await request.json()) as { domain?: string; token?: string };

    try {
      const domain = await verifyDomainMock({
        domain: body?.domain ?? "",
        token: body?.token ?? "",
      });
      return HttpResponse.json(domain);
    } catch (error) {
      if (error instanceof ApiError) {
        const message = typeof error.data === "object" && error.data && "message" in error.data
          ? (error.data as { message?: string }).message ?? error.message
          : error.message;
        return HttpResponse.json({ message }, { status: error.status });
      }

      return HttpResponse.json(
        { message: "Verification failed. Please try again." },
        { status: 500 },
      );
    }
  }),
];
