export type TimezoneOption = {
  value: string
  label: string
  region: string
}

export const TIMEZONES: TimezoneOption[] = [
  // Americas
  { value: 'Pacific/Honolulu',       label: 'Hawaii (HST)',               region: 'Americas' },
  { value: 'America/Anchorage',      label: 'Alaska (AKT)',               region: 'Americas' },
  { value: 'America/Los_Angeles',    label: 'Pacific Time (PT)',          region: 'Americas' },
  { value: 'America/Phoenix',        label: 'Arizona (MST)',              region: 'Americas' },
  { value: 'America/Denver',         label: 'Mountain Time (MT)',         region: 'Americas' },
  { value: 'America/Chicago',        label: 'Central Time (CT)',          region: 'Americas' },
  { value: 'America/New_York',       label: 'Eastern Time (ET)',          region: 'Americas' },
  { value: 'America/Toronto',        label: 'Toronto (ET)',               region: 'Americas' },
  { value: 'America/Vancouver',      label: 'Vancouver (PT)',             region: 'Americas' },
  { value: 'America/Mexico_City',    label: 'Mexico City (CST)',          region: 'Americas' },
  { value: 'America/Bogota',         label: 'Bogotá (COT)',               region: 'Americas' },
  { value: 'America/Lima',           label: 'Lima (PET)',                 region: 'Americas' },
  { value: 'America/Sao_Paulo',      label: 'São Paulo (BRT)',            region: 'Americas' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)', region: 'Americas' },
  { value: 'America/Santiago',       label: 'Santiago (CLT)',             region: 'Americas' },
  // Europe & Africa
  { value: 'UTC',                    label: 'UTC',                        region: 'Europe & Africa' },
  { value: 'Europe/Lisbon',          label: 'Lisbon (WET)',               region: 'Europe & Africa' },
  { value: 'Europe/London',          label: 'London (GMT/BST)',           region: 'Europe & Africa' },
  { value: 'Europe/Dublin',          label: 'Dublin (IST)',               region: 'Europe & Africa' },
  { value: 'Europe/Paris',           label: 'Paris (CET)',                region: 'Europe & Africa' },
  { value: 'Europe/Berlin',          label: 'Berlin (CET)',               region: 'Europe & Africa' },
  { value: 'Europe/Rome',            label: 'Rome (CET)',                 region: 'Europe & Africa' },
  { value: 'Europe/Madrid',          label: 'Madrid (CET)',               region: 'Europe & Africa' },
  { value: 'Europe/Amsterdam',       label: 'Amsterdam (CET)',            region: 'Europe & Africa' },
  { value: 'Europe/Stockholm',       label: 'Stockholm (CET)',            region: 'Europe & Africa' },
  { value: 'Europe/Warsaw',          label: 'Warsaw (CET)',               region: 'Europe & Africa' },
  { value: 'Europe/Istanbul',        label: 'Istanbul (TRT)',             region: 'Europe & Africa' },
  { value: 'Europe/Moscow',          label: 'Moscow (MSK)',               region: 'Europe & Africa' },
  { value: 'Africa/Lagos',           label: 'Lagos (WAT)',                region: 'Europe & Africa' },
  { value: 'Africa/Cairo',           label: 'Cairo (EET)',                region: 'Europe & Africa' },
  { value: 'Africa/Nairobi',         label: 'Nairobi (EAT)',              region: 'Europe & Africa' },
  { value: 'Africa/Johannesburg',    label: 'Johannesburg (SAST)',        region: 'Europe & Africa' },
  // Asia & Pacific
  { value: 'Asia/Dubai',             label: 'Dubai (GST)',                region: 'Asia & Pacific' },
  { value: 'Asia/Karachi',           label: 'Karachi (PKT)',              region: 'Asia & Pacific' },
  { value: 'Asia/Kolkata',           label: 'India (IST)',                region: 'Asia & Pacific' },
  { value: 'Asia/Dhaka',             label: 'Dhaka (BST)',                region: 'Asia & Pacific' },
  { value: 'Asia/Bangkok',           label: 'Bangkok (ICT)',              region: 'Asia & Pacific' },
  { value: 'Asia/Singapore',         label: 'Singapore (SGT)',            region: 'Asia & Pacific' },
  { value: 'Asia/Shanghai',          label: 'Beijing / Shanghai (CST)',   region: 'Asia & Pacific' },
  { value: 'Asia/Tokyo',             label: 'Tokyo (JST)',                region: 'Asia & Pacific' },
  { value: 'Asia/Seoul',             label: 'Seoul (KST)',                region: 'Asia & Pacific' },
  { value: 'Asia/Jakarta',           label: 'Jakarta (WIB)',              region: 'Asia & Pacific' },
  { value: 'Asia/Manila',            label: 'Manila (PST)',               region: 'Asia & Pacific' },
  { value: 'Australia/Perth',        label: 'Perth (AWST)',               region: 'Asia & Pacific' },
  { value: 'Australia/Adelaide',     label: 'Adelaide (ACST)',            region: 'Asia & Pacific' },
  { value: 'Australia/Sydney',       label: 'Sydney (AEST)',              region: 'Asia & Pacific' },
  { value: 'Pacific/Auckland',       label: 'Auckland (NZST)',            region: 'Asia & Pacific' },
]
