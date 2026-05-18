import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function inr(amount: number | null | undefined): string {
  if (amount == null || isNaN(Number(amount))) return "—";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function pct(num: number, denom: number): string {
  if (!denom) return "0%";
  return `${((num / denom) * 100).toFixed(1)}%`;
}

export function daysBetween(a: string | Date, b: string | Date = new Date()): number {
  const da = typeof a === "string" ? new Date(a) : a;
  const db = typeof b === "string" ? new Date(b) : b;
  const ms = db.getTime() - da.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatLabel(snake: string | null | undefined): string {
  if (!snake) return "—";
  return snake.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
