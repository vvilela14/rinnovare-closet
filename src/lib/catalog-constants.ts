export const COLOR_PALETTE: { name: string; hex: string; border?: boolean }[] = [
  { name: "Amarelo", hex: "#FFF24D" },
  { name: "Azul", hex: "#2A1FE0" },
  { name: "Azul claro", hex: "#7EC8E3" },
  { name: "Azul marinho", hex: "#0B1F4D" },
  { name: "Bege", hex: "#D2B48C" },
  { name: "Branco", hex: "#FFFFFF", border: true },
  { name: "Cinza", hex: "#8A8A8A" },
  { name: "Dourado", hex: "#D4AF37" },
  { name: "Laranja", hex: "#F97316" },
  { name: "Lilás", hex: "#C8A2C8" },
  { name: "Marrom", hex: "#7B3F00" },
  { name: "Multicor", hex: "conic-gradient(from 0deg, #ec4899, #3b82f6, #f59e0b, #10b981, #ec4899)" },
  { name: "Nude", hex: "#E6BFA5" },
  { name: "Off white", hex: "#F5F1E6", border: true },
  { name: "Prata", hex: "#C0C0C0" },
  { name: "Preto", hex: "#000000" },
  { name: "Rosa", hex: "#F4A6C0" },
  { name: "Rosa choque", hex: "#E91E63" },
  { name: "Roxo", hex: "#6B21A8" },
  { name: "Verde", hex: "#16A34A" },
  { name: "Verde esmeralda", hex: "#047857" },
  { name: "Verde menta", hex: "#A8E6CF" },
  { name: "Vermelho", hex: "#DC2626" },
  { name: "Vinho", hex: "#7B1E2B" },
];

export const RENTAL_PERIODS = [4, 7, 12] as const;
export type RentalPeriod = (typeof RENTAL_PERIODS)[number];

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function fmtISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(s: string): Date {
  return new Date(s + "T00:00:00");
}

/** True if [aStart,aEnd] overlaps [bStart,bEnd] (inclusive). */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}
