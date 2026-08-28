export type MaskLevel = "off" | "partial" | "full";

export interface PrivacyConfig {
  level: MaskLevel;
  fields: {
    customerName: boolean;
    cif: boolean;
    phone: boolean;
    taxId: boolean;
    staffName: boolean;
    department: boolean;
  };
}

export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  level: "off",
  fields: {
    customerName: true,
    cif: true,
    phone: true,
    taxId: true,
    staffName: false,
    department: false,
  },
};

function isUnmaskable(value: string): boolean {
  if (!value || value.trim() === "") return true;
  const lower = value.trim().toLowerCase();
  if (lower === "—" || lower === "-" || lower === "chưa cập nhật" || lower === "chưa có cif" || lower === "không có") {
    return true;
  }
  return false;
}

export function maskName(name: string, level: MaskLevel): string {
  if (level === "off" || isUnmaskable(name)) return name;
  if (level === "full") return "••••••••";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const word = parts[0];
    return word.length > 2 ? `${word.substring(0, 1)}***${word.substring(word.length - 1)}` : `${word.substring(0, 1)}***`;
  }
  
  const firstWord = parts[0];
  const rest = parts.slice(1).map(p => p.charAt(0) + "***");
  return [firstWord, ...rest].join(" ");
}

export function maskCif(cif: string, level: MaskLevel): string {
  if (level === "off" || isUnmaskable(cif)) return cif;
  if (level === "full") return "••••••••";

  const clean = cif.trim();
  if (clean.length <= 5) return clean.charAt(0) + "****" + clean.charAt(clean.length - 1);
  return clean.substring(0, 3) + "****" + clean.substring(clean.length - 2);
}

export function maskPhone(phone: string, level: MaskLevel): string {
  if (level === "off" || isUnmaskable(phone)) return phone;
  if (level === "full") return "••••••••";

  const clean = phone.trim();
  if (clean.length <= 6) return clean.substring(0, 2) + "****";
  return clean.substring(0, 4) + "****" + clean.substring(clean.length - 2);
}

export function maskTaxId(taxId: string, level: MaskLevel): string {
  if (level === "off" || isUnmaskable(taxId)) return taxId;
  if (level === "full") return "••••••••";

  const clean = taxId.trim();
  if (clean.length <= 4) return clean.substring(0, 1) + "******";
  return clean.substring(0, 2) + "******" + clean.substring(clean.length - 2);
}

export function maskStaffName(name: string, level: MaskLevel): string {
  if (level === "off" || isUnmaskable(name)) return name;
  if (level === "full") return "••••";

  const clean = name.trim();
  return clean.charAt(0) + "***";
}

export function maskDepartment(dept: string, level: MaskLevel): string {
  if (level === "off" || isUnmaskable(dept)) return dept;
  if (level === "full") return "••••";

  const clean = dept.trim();
  if (clean.length <= 3) return clean.charAt(0) + "***";
  return clean.substring(0, 3) + "***";
}

export function maskField(value: string, fieldType: keyof PrivacyConfig["fields"], config: PrivacyConfig): string {
  if (config.level === "off") return value;
  if (!config.fields[fieldType]) return value;

  switch (fieldType) {
    case "customerName":
      return maskName(value, config.level);
    case "cif":
      return maskCif(value, config.level);
    case "phone":
      return maskPhone(value, config.level);
    case "taxId":
      return maskTaxId(value, config.level);
    case "staffName":
      return maskStaffName(value, config.level);
    case "department":
      return maskDepartment(value, config.level);
    default:
      return value;
  }
}
