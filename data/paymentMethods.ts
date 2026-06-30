export interface PaymentOption {
  label: string;
  value: string;
}

export const DEFAULT_BANKS: PaymentOption[] = [
  { label: "Bank of Kigali (BK)", value: "Bank of Kigali" },
  { label: "I&M Bank Rwanda", value: "I&M Bank" },
  { label: "Equity Bank Rwanda", value: "Equity Bank" },
  { label: "Access Bank Rwanda", value: "Access Bank" },
  { label: "Cogebanque", value: "Cogebanque" },
  { label: "Ecobank Rwanda", value: "Ecobank" },
  { label: "GT Bank Rwanda", value: "GT Bank" },
  { label: "NCBA Rwanda", value: "NCBA" },
  { label: "Zigama CSS", value: "Zigama CSS" },
];

export const DEFAULT_MOMO: PaymentOption[] = [
  { label: "MTN Mobile Money", value: "MTN MoMo" },
  { label: "Airtel Money", value: "Airtel Money" },
];

export const LS_KEY_BANKS = "admin_banks";
export const LS_KEY_MOMO  = "admin_momo";

export function getBanks(): PaymentOption[] {
  if (typeof window === "undefined") return DEFAULT_BANKS;
  try {
    const stored = localStorage.getItem(LS_KEY_BANKS);
    return stored ? JSON.parse(stored) : DEFAULT_BANKS;
  } catch {
    return DEFAULT_BANKS;
  }
}

export function getMomo(): PaymentOption[] {
  if (typeof window === "undefined") return DEFAULT_MOMO;
  try {
    const stored = localStorage.getItem(LS_KEY_MOMO);
    return stored ? JSON.parse(stored) : DEFAULT_MOMO;
  } catch {
    return DEFAULT_MOMO;
  }
}

export function saveBanks(banks: PaymentOption[]): void {
  localStorage.setItem(LS_KEY_BANKS, JSON.stringify(banks));
}

export function saveMomo(momo: PaymentOption[]): void {
  localStorage.setItem(LS_KEY_MOMO, JSON.stringify(momo));
}
