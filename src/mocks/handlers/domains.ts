import { ApiError } from "@/api/client";
import {
  getDomainMock,
  listDomainsMock,
  removeDomainMock,
  updateDomainMock,
  verifyDomainMock,
} from "../domains-mock-api";

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
  http.get(`${API_BASE}/domains/:domainId`, async ({ params }: { params: { domainId?: string } }) => {
    await randomDelay(delay);
    const domainId = params?.domainId ?? "";

    try {
      const domain = await getDomainMock(domainId);
      return HttpResponse.json(domain);
    } catch (error) {
      if (error instanceof ApiError) {
        const message =
          typeof error.data === "object" && error.data && "message" in error.data
            ? (error.data as { message?: string }).message ?? error.message
            : error.message;
        return HttpResponse.json({ message }, { status: error.status });
      }

      return HttpResponse.json(
        { message: "Unable to load domain." },
        { status: 500 },
      );
    }
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
  http.patch(
    `${API_BASE}/domains/:domainId`,
    async ({ params, request }: { params: { domainId?: string }; request: Request }) => {
      await randomDelay(delay);
      const domainId = params?.domainId ?? "";
      const body = (await request.json()) as { domain?: string };

      try {
        const domain = await updateDomainMock({
          id: domainId,
          domain: body?.domain ?? "",
        });
        return HttpResponse.json(domain);
      } catch (error) {
        if (error instanceof ApiError) {
          const message =
            typeof error.data === "object" && error.data && "message" in error.data
              ? (error.data as { message?: string }).message ?? error.message
              : error.message;
          return HttpResponse.json({ message }, { status: error.status });
        }

        return HttpResponse.json({ message: "Unable to update domain." }, { status: 500 });
      }
    },
  ),
  http.delete(`${API_BASE}/domains/:domainId`, async ({ params }: { params: { domainId?: string } }) => {
    await randomDelay(delay);
    const domainId = params?.domainId ?? "";

    try {
      await removeDomainMock(domainId);
      return HttpResponse.json(null, { status: 204 });
    } catch (error) {
      if (error instanceof ApiError) {
        const message =
          typeof error.data === "object" && error.data && "message" in error.data
            ? (error.data as { message?: string }).message ?? error.message
            : error.message;
        return HttpResponse.json({ message }, { status: error.status });
      }

      return HttpResponse.json({ message: "Unable to remove domain." }, { status: 500 });
    }
  }),
];
