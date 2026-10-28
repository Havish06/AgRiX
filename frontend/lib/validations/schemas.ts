import { z } from 'zod';

export const yieldPredictionRequestSchema = z.object({
  region_code: z.string().regex(/^[A-Z]{2,3}(-[A-Z]{2})?$/, 'Invalid region code format'),
  crop_code: z.string().min(1).max(20),
  year: z.number().int().min(1960).max(2030),
  rainfall_mm: z.number().min(0).max(5000),
  temperature_c: z.number().min(-50).max(60),
  soil_moisture: z.number().min(0).max(1).optional(),
  fertilizer_kg_ha: z.number().min(0).optional(),
});

export type YieldPredictionRequestInput = z.infer<typeof yieldPredictionRequestSchema>;

export const riskAssessmentRequestSchema = z.object({
  region_code: z.string().regex(/^[A-Z]{2,3}(-[A-Z]{2})?$/),
  crop_code: z.string().min(1).max(20),
  year: z.number().int().min(1960).max(2030),
  financial_indicators: z.record(z.string(), z.number()),
  climate_variables: z.record(z.string(), z.number()).optional(),
  agricultural_variables: z.record(z.string(), z.number()).optional(),
});

export type RiskAssessmentRequestInput = z.infer<typeof riskAssessmentRequestSchema>;

export const forecastRequestSchema = z.object({
  region_code: z.string().regex(/^[A-Z]{2,3}(-[A-Z]{2})?$/),
  crop_code: z.string().min(1).max(20),
  horizon: z.number().int().min(1).max(10),
  model: z.enum(['linear', 'ridge', 'rf', 'xgboost']).optional(),
  uncertainty_method: z.enum(['bootstrap', 'conformal', 'quantile']).optional(),
});

export type ForecastRequestInput = z.infer<typeof forecastRequestSchema>;

export const scenarioRequestSchema = z.object({
  region_code: z.string().regex(/^[A-Z]{2,3}(-[A-Z]{2})?$/),
  crop_code: z.string().min(1).max(20),
  scenario: z.enum(['normal', 'dry', 'heat', 'severe', 'custom']),
  custom_params: z
    .object({
      rainfall_multiplier: z.number().min(0.1).max(3).optional(),
      temperature_offset: z.number().min(-10).max(10).optional(),
      crop_price_multiplier: z.number().min(0.1).max(5).optional(),
      loan_exposure_multiplier: z.number().min(0.1).max(5).optional(),
    })
    .optional(),
  n_simulations: z.number().int().min(100).max(50000).optional(),
  confidence_level: z.number().min(0.8).max(0.999).optional(),
});

export type ScenarioRequestInput = z.infer<typeof scenarioRequestSchema>;

export const experimentConfigSchema = z.object({
  name: z.string().min(1).max(100),
  dataset_version: z.string(),
  feature_version: z.string(),
  model_type: z.enum(['linear', 'ridge', 'lasso', 'rf', 'xgboost']),
  hyperparameters: z.record(z.string(), z.unknown()),
  random_seed: z.number().int().default(42),
  train_period: z.string(),
  validation_period: z.string(),
  test_period: z.string(),
  uncertainty_method: z.enum(['bootstrap', 'conformal', 'quantile']),
});

export type ExperimentConfigInput = z.infer<typeof experimentConfigSchema>;
