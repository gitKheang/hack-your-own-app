declare module "msw" {
  export const http: Record<string, (...args: any[]) => unknown>;
  export const delay: (duration?: number) => Promise<void>;

  export class HttpResponse {
    static json<T>(body: T, init?: { status?: number }): Response;
  }
}
