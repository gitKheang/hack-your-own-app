import { apiRequest } from "./client";
import type {
  ChangeEmailRequest,
  ChangePasswordRequest,
  ProfileResponse,
  ProfileUpdateRequest,
  VerifyEmailRequest,
} from "@/types/settings";

export const getMe = () => apiRequest<ProfileResponse>("/me");

export const updateMe = (payload: ProfileUpdateRequest) =>
  apiRequest<ProfileResponse>("/me", {
    method: "PUT",
    json: payload,
  });

export const changeEmail = (payload: ChangeEmailRequest) =>
  apiRequest<{ email: string }>("/auth/change-email", {
    method: "POST",
    json: payload,
  });

export const verifyEmail = (payload: VerifyEmailRequest) =>
  apiRequest<ProfileResponse>("/auth/verify-email", {
    method: "POST",
    json: payload,
  });

export const resendVerification = () =>
  apiRequest<{ ok: boolean }>("/auth/resend-verification", {
    method: "POST",
  });

export const changePassword = (payload: ChangePasswordRequest) =>
  apiRequest<{ ok: boolean }>("/auth/change-password", {
    method: "POST",
    json: payload,
  });
