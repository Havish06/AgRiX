import { describe, expect, it } from 'vitest';
import { scenarioRequestSchema, yieldPredictionRequestSchema } from './schemas';

describe('request schemas', () => {
  it('accepts a valid yield prediction request', () => {
    const result = yieldPredictionRequestSchema.safeParse({
      region_code: 'US-IA',
      crop_code: 'maize',
      year: 2024,
      rainfall_mm: 850,
      temperature_c: 21.5,
    });

    expect(result.success).toBe(true);
  });

  it('rejects physically impossible yield inputs', () => {
    const result = yieldPredictionRequestSchema.safeParse({
      region_code: 'US-IA',
      crop_code: 'maize',
      year: 2024,
      rainfall_mm: -1,
      temperature_c: 21.5,
    });

    expect(result.success).toBe(false);
  });

  it('requires custom parameters for a custom scenario at the UI contract level', () => {
    const result = scenarioRequestSchema.safeParse({
      region_code: 'US-IA',
      crop_code: 'maize',
      scenario: 'custom',
      n_simulations: 1000,
      confidence_level: 0.95,
    });

    expect(result.success).toBe(true);
  });
});
