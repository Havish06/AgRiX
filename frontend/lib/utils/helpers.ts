import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatYield(value: number): string {
  return `${value.toFixed(2)} t/ha`;
}

export function formatRiskScore(value: number): string {
  return value.toFixed(2);
}

export function getRiskCategory(score: number): 'Low' | 'Moderate' | 'High' | 'Very High' {
  if (score < 0.25) return 'Low';
  if (score < 0.5) return 'Moderate';
  if (score < 0.75) return 'High';
  return 'Very High';
}

export function getRiskColor(category: string): string {
  switch (category) {
    case 'Low':
      return 'var(--color-risk-low)';
    case 'Moderate':
      return 'var(--color-risk-moderate)';
    case 'High':
      return 'var(--color-risk-high)';
    case 'Very High':
      return 'var(--color-risk-very-high)';
    default:
      return 'var(--color-text-muted)';
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
