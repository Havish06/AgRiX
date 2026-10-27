import { describe, expect, it } from 'vitest';
import { formatCurrency, formatPercent, getRiskCategory, getRiskColor } from './helpers';

describe('formatting helpers', () => {
  it('formats currency and percentages using the application display conventions', () => {
    expect(formatCurrency(12400)).toBe('$12,400');
    expect(formatPercent(18)).toBe('18%');
    expect(formatPercent(18.25, 2)).toBe('18.25%');
  });
});

describe('risk helpers', () => {
  it('maps scores to the documented risk bands', () => {
    expect(getRiskCategory(0)).toBe('Low');
    expect(getRiskCategory(0.25)).toBe('Moderate');
    expect(getRiskCategory(0.5)).toBe('High');
    expect(getRiskCategory(0.75)).toBe('Very High');
  });

  it('returns a neutral color for unknown categories', () => {
    expect(getRiskColor('Unknown')).toBe('var(--color-text-muted)');
  });
});
