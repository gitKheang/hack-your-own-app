import { ApiError } from "@/api/client";
import {
  createScanMock,
  getScanDetailMock,
  listScansMock,
  runPassiveScanMock,
  removeScanMock,
  removeScansForDomainMock,
} from "../scans-mock-api";

const API_BASE = "/api";

const randomDelay = (delay: (duration?: number) => Promise<void>) =>
  delay(150 + Math.random() * 450);

export const createScanHandlers = ({
  http,
  delay,
  HttpResponse,
}: {
  http: typeof import("msw").http;
  delay: typeof import("msw").delay;
  HttpResponse: typeof import("msw").HttpResponse;
}) => [
  http.post(`${API_BASE}/scans/passive`, async ({ request }: { request: Request }) => {
    await randomDelay(delay);
    const body = await request.json();
    const response = await runPassiveScanMock(body);
    return HttpResponse.json(response, { status: 201 });
  }),
  http.post(`${API_BASE}/scans`, async ({ request }: { request: Request }) => {
    await randomDelay(delay);
    const body = await request.json();
    const scan = await createScanMock(body);
    return HttpResponse.json(scan, { status: 201 });
  }),
  http.get(`${API_BASE}/scans`, async () => {
    await randomDelay(delay);
    const scans = await listScansMock();
    return HttpResponse.json(scans);
  }),
  http.get(`${API_BASE}/scans/:scanId`, async ({ params }: { params: { scanId?: string } }) => {
    await randomDelay(delay);
    const scanId = params?.scanId ?? "";
    try {
      const detail = await getScanDetailMock(scanId);
      return HttpResponse.json(detail);
    } catch (error) {
      if (error instanceof ApiError) {
        const message =
          typeof error.data === "object" && error.data && "message" in error.data
            ? (error.data as { message?: string }).message ?? error.message
            : error.message;
        return HttpResponse.json({ message }, { status: error.status });
      }
      return HttpResponse.json({ message: "Unable to load scan." }, { status: 500 });
    }
  }),
  http.delete(
    `${API_BASE}/domains/:domainId/scans`,
    async ({ params }: { params: { domainId?: string } }) => {
      await randomDelay(delay);
      const domainId = params?.domainId ?? "";
      await removeScansForDomainMock(domainId);
      return HttpResponse.json(null, { status: 204 });
    },
  ),
  http.delete(`${API_BASE}/scans/:scanId`, async ({ params }: { params: { scanId?: string } }) => {
    await randomDelay(delay);
    const scanId = params?.scanId ?? "";

    try {
      await removeScanMock(scanId);
      return HttpResponse.json(null, { status: 204 });
    } catch (error) {
      if (error instanceof ApiError) {
        const message =
          typeof error.data === "object" && error.data && "message" in error.data
            ? (error.data as { message?: string }).message ?? error.message
            : error.message;
        return HttpResponse.json({ message }, { status: error.status });
      }

      return HttpResponse.json({ message: "Unable to remove scan." }, { status: 500 });
    }
  }),
];
