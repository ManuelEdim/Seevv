// Nigerian timezones
const NIGERIAN_TIMEZONES = ["Africa/Lagos"];

// Nigerian locale hints
const NIGERIAN_LOCALES = ["en-NG", "ha", "yo", "ig"];

// Detect if user is likely Nigerian from browser signals
export const detectIsNigerian = () => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language || navigator.languages?.[0] || "";

    const timezoneMatch = NIGERIAN_TIMEZONES.includes(timezone);
    const localeMatch = NIGERIAN_LOCALES.some((l) =>
      locale.toLowerCase().startsWith(l.toLowerCase()),
    );

    return timezoneMatch || localeMatch;
  } catch {
    return false;
  }
};

// Get detected country name from timezone
export const getDetectedCountry = () => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (NIGERIAN_TIMEZONES.includes(timezone)) return "Nigeria";
    return null;
  } catch {
    return null;
  }
};

// Common African + global countries for the selector
export const COUNTRIES = [
  { value: "NG", label: "Nigeria" },
  { value: "GH", label: "Ghana" },
  { value: "KE", label: "Kenya" },
  { value: "ZA", label: "South Africa" },
  { value: "ET", label: "Ethiopia" },
  { value: "TZ", label: "Tanzania" },
  { value: "UG", label: "Uganda" },
  { value: "RW", label: "Rwanda" },
  { value: "SN", label: "Senegal" },
  { value: "CI", label: "Côte d'Ivoire" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "NL", label: "Netherlands" },
  { value: "AE", label: "UAE" },
  { value: "other", label: "Other" },
];
