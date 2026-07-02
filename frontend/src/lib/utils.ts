import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Nationality -> ISO 3166-1 alpha-2 for flag rendering. */
const NATIONALITY_TO_COUNTRY: Record<string, string> = {
  British: "gb",
  German: "de",
  Dutch: "nl",
  Spanish: "es",
  Mexican: "mx",
  Monegasque: "mc",
  Finnish: "fi",
  French: "fr",
  Australian: "au",
  Canadian: "ca",
  Japanese: "jp",
  Chinese: "cn",
  Thai: "th",
  Danish: "dk",
  Italian: "it",
  American: "us",
  Argentine: "ar",
  "Argentine-Italian": "ar",
  Brazilian: "br",
  Austrian: "at",
  Belgian: "be",
  Swiss: "ch",
  Swedish: "se",
  Polish: "pl",
  Russian: "ru",
  Indian: "in",
  Indonesian: "id",
  Malaysian: "my",
  Venezuelan: "ve",
  Colombian: "co",
  Portuguese: "pt",
  "New Zealander": "nz",
  Irish: "ie",
  "South African": "za",
  Hungarian: "hu",
  Czech: "cz",
  Uruguayan: "uy",
  Chilean: "cl",
  Liechtensteiner: "li",
  Rhodesian: "zw",
  "East German": "de",
  Zimbabwean: "zw",
};

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  Bahrain: "bh",
  "Saudi Arabia": "sa",
  Australia: "au",
  Japan: "jp",
  China: "cn",
  USA: "us",
  "United States": "us",
  Italy: "it",
  Monaco: "mc",
  Canada: "ca",
  Spain: "es",
  Austria: "at",
  UK: "gb",
  "United Kingdom": "gb",
  Hungary: "hu",
  Belgium: "be",
  Netherlands: "nl",
  Azerbaijan: "az",
  Singapore: "sg",
  Mexico: "mx",
  Brazil: "br",
  Qatar: "qa",
  UAE: "ae",
  "United Arab Emirates": "ae",
  France: "fr",
  Germany: "de",
  Portugal: "pt",
  Russia: "ru",
  Turkey: "tr",
  Malaysia: "my",
  Korea: "kr",
  India: "in",
  Argentina: "ar",
  "South Africa": "za",
  Sweden: "se",
  Switzerland: "ch",
  Morocco: "ma",
  Vietnam: "vn",
};

export function nationalityFlag(nationality: string | null | undefined): string | null {
  if (!nationality) return null;
  const code = NATIONALITY_TO_COUNTRY[nationality];
  return code ? flagEmoji(code) : null;
}

export function countryFlag(country: string | null | undefined): string | null {
  if (!country) return null;
  const code = COUNTRY_NAME_TO_CODE[country];
  return code ? flagEmoji(code) : null;
}

function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
