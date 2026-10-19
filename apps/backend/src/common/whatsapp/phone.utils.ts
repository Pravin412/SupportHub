export function normalizePhoneNumber(countryCode?: string | number, phoneNumber?: string | number | bigint): string | null {
  const cleanCC = String(countryCode ?? "").replace(/\D/g, "");
  let cleanNum = String(phoneNumber ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (!cleanNum) return null;
  if (cleanCC && cleanNum.startsWith(cleanCC) && cleanNum.length > cleanCC.length + 6) {
    return cleanNum;
  }
  const full = `${cleanCC}${cleanNum}`;
  return full.length >= 9 ? full : null;
}

// Same rule as the project access member form: digits only, country code required, 9-15 digits.
export const PHONE_PATTERN = /^[1-9]\d{8,14}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s()+-]/g, "");
}

export function parsePhoneList(value?: string | string[] | null): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      (Array.isArray(value) ? value : value.split(/[,;\n]+/))
        .map(normalizePhone)
        .filter((phone) => PHONE_PATTERN.test(phone))
    )
  );
}
