const DEMO_BLUR_ENV_ON_VALUES = new Set(["1", "true", "on", "yes"]);

export const isDemoSensitiveBlurEnabled = DEMO_BLUR_ENV_ON_VALUES.has(
  String(process.env.NEXT_PUBLIC_DEMO_BLUR ?? "").toLowerCase(),
);

export const DEMO_SENSITIVE_BLUR_CLASS = isDemoSensitiveBlurEnabled
  ? "select-none blur-[3px]"
  : "";
