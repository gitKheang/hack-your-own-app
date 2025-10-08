import {
  settingsStore,
  createOtpCode,
  revokeAllSessions,
  revokeSession,
} from "./store";
import type {
  ChangeEmailRequest,
  ChangePasswordRequest,
  ProfileResponse,
  ProfileUpdateRequest,
  VerifyEmailRequest,
} from "@/types/settings";

export const getProfileMock = async (): Promise<ProfileResponse> => settingsStore.profile;

export const updateProfileMock = async (payload: ProfileUpdateRequest): Promise<ProfileResponse> => {
  settingsStore.profile = {
    ...settingsStore.profile,
    ...payload,
    email_verified: settingsStore.profile.email_verified,
    email: settingsStore.profile.email,
  };
  return settingsStore.profile;
};

export const changeEmailMock = async ({ email }: ChangeEmailRequest) => {
  if (!email) {
    throw new Error("Email is required");
  }

  if (email.toLowerCase() === settingsStore.profile.email.toLowerCase()) {
    throw new Error("New email must be different from the current one.");
  }

  const code = createOtpCode();
  settingsStore.pendingEmailChange = { email, code };
  settingsStore.profile = { ...settingsStore.profile, email_verified: false };

  return { email };
};

export const verifyEmailMock = async ({ email, code }: VerifyEmailRequest): Promise<ProfileResponse> => {
  if (!email || !code) {
    throw new Error("Email and code are required.");
  }

  const pending = settingsStore.pendingEmailChange;

  if (pending) {
    if (pending.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error("No verification pending for this email.");
    }

    if (pending.code !== code) {
      throw new Error("Invalid verification code.");
    }

    settingsStore.profile = {
      ...settingsStore.profile,
      email: pending.email,
      email_verified: true,
    };

    settingsStore.pendingEmailChange = null;
    return settingsStore.profile;
  }

  if (settingsStore.profile.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error("Email is already verified or does not match.");
  }

  if (settingsStore.profile.email_verified) {
    throw new Error("Email is already verified.");
  }

  settingsStore.profile = { ...settingsStore.profile, email_verified: true };
  return settingsStore.profile;
};

export const resendVerificationMock = async () => {
  const code = createOtpCode();
  settingsStore.pendingEmailChange = {
    email: settingsStore.profile.email,
    code,
  };
  settingsStore.profile = { ...settingsStore.profile, email_verified: false };
  return { ok: true };
};

export const changePasswordMock = async ({ current, next }: ChangePasswordRequest) => {
  if (!current || !next) {
    throw new Error("Current and new passwords are required.");
  }

  if (current !== settingsStore.password) {
    throw new Error("Current password is incorrect.");
  }

  settingsStore.password = next;
  return { ok: true };
};

export const logoutMock = async () => {
  revokeAllSessions();
  return { ok: true };
};

export const listSessionsMock = async () => settingsStore.sessions;

export const revokeSessionMock = async (id: string) => {
  revokeSession(id);
  return { ok: true };
};

export const revokeAllSessionsMock = async () => {
  revokeAllSessions();
  return { ok: true };
};
