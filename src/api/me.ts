import { apiRequest } from "./client";
import { shouldUseMock, shouldUseMockFallback } from "./utils";
import type {
  ChangeEmailRequest,
  ChangePasswordRequest,
  ProfileResponse,
  ProfileUpdateRequest,
  VerifyEmailRequest,
} from "@/types/settings";

const loadProfileMockModule = () => import("@/mocks/profile-mock-api");

export const getMe = async () => {
  if (shouldUseMock()) {
    const { getProfileMock } = await loadProfileMockModule();
    return getProfileMock();
  }

  try {
    return await apiRequest<ProfileResponse>("/me");
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { getProfileMock } = await loadProfileMockModule();
      return getProfileMock();
    }
    throw error;
  }
};

export const updateMe = async (payload: ProfileUpdateRequest) => {
  if (shouldUseMock()) {
    const { updateProfileMock } = await loadProfileMockModule();
    return updateProfileMock(payload);
  }

  try {
    return await apiRequest<ProfileResponse>("/me", {
      method: "PUT",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { updateProfileMock } = await loadProfileMockModule();
      return updateProfileMock(payload);
    }
    throw error;
  }
};

export const changeEmail = async (payload: ChangeEmailRequest) => {
  if (shouldUseMock()) {
    const { changeEmailMock } = await loadProfileMockModule();
    return changeEmailMock(payload);
  }

  try {
    return await apiRequest<{ email: string }>("/auth/change-email", {
      method: "POST",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { changeEmailMock } = await loadProfileMockModule();
      return changeEmailMock(payload);
    }
    throw error;
  }
};

export const verifyEmail = async (payload: VerifyEmailRequest) => {
  if (shouldUseMock()) {
    const { verifyEmailMock } = await loadProfileMockModule();
    return verifyEmailMock(payload);
  }

  try {
    return await apiRequest<ProfileResponse>("/auth/verify-email", {
      method: "POST",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { verifyEmailMock } = await loadProfileMockModule();
      return verifyEmailMock(payload);
    }
    throw error;
  }
};

export const resendVerification = async () => {
  if (shouldUseMock()) {
    const { resendVerificationMock } = await loadProfileMockModule();
    return resendVerificationMock();
  }

  try {
    return await apiRequest<{ ok: boolean }>("/auth/resend-verification", {
      method: "POST",
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { resendVerificationMock } = await loadProfileMockModule();
      return resendVerificationMock();
    }
    throw error;
  }
};

export const changePassword = async (payload: ChangePasswordRequest) => {
  if (shouldUseMock()) {
    const { changePasswordMock } = await loadProfileMockModule();
    return changePasswordMock(payload);
  }

  try {
    return await apiRequest<{ ok: boolean }>("/auth/change-password", {
      method: "POST",
      json: payload,
    });
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      const { changePasswordMock } = await loadProfileMockModule();
      return changePasswordMock(payload);
    }
    throw error;
  }
};
