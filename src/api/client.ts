import { env } from "@/lib/env";

export class ApiError<T = unknown> extends Error {
  status: number;
  data: T | null;

  constructor(message: string, status: number, data: T | null = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type ApiRequestOptions = RequestInit & {
  json?: unknown;
};

export const apiRequest = async <TResponse = unknown>(
  path: string,
  { json, headers, ...init }: ApiRequestOptions = {},
): Promise<TResponse> => {
  const config: RequestInit = {
    credentials: "include",
    ...init,
  };

  if (json !== undefined) {
    config.body = JSON.stringify(json);
    config.headers = {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    };
  } else if (headers) {
    config.headers = headers;
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, config);
  const contentType = response.headers.get("content-type") ?? "";

  const parseJson = async () => {
    try {
      return await response.json();
    } catch (error) {
      console.warn("Failed to parse JSON response", error);
      return null;
    }
  };

  if (!response.ok) {
    const errorBody = contentType.includes("application/json")
      ? await parseJson()
      : await response.text();

    throw new ApiError(
      typeof errorBody === "string" && errorBody.trim().length
        ? errorBody
        : response.statusText || "Request failed",
      response.status,
      errorBody as TResponse,
    );
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  if (contentType.includes("application/json")) {
    const data = await parseJson();
    return data as TResponse;
  }

  return (await response.text()) as TResponse;
};
