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

export function parsePhoneList(value?: string | string[] | null): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      (Array.isArray(value) ? value : value.split(/[\s,;]+/))
        .map((phone) => phone.replace(/\D/g, "").replace(/^0+/, ""))
        .filter((phone) => phone.length >= 9)
    )
  );
}
