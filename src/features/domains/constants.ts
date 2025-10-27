export const DOMAIN_VERIFY_TYPE = "TXT";
export const DOMAIN_VERIFY_HOST = "_hyow-verify";
export const DOMAIN_VERIFY_TOKEN = "HYOW-VERIFY-PLACEHOLDER-XXXXXX";
export const DOMAIN_VERIFY_HELP_TEXT =
  "Add this TXT record at your DNS provider, wait 1–2 minutes, then verify.";

export const DOMAIN_NAME_REGEX =
  /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
export const DOMAIN_NAME_PATTERN = DOMAIN_NAME_REGEX.source;
