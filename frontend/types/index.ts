export interface YieldPredictionRequest {
  region_code: string;
  crop_code: string;
  year: number;
  rainfall_mm: number;
  temperature_c: number;
  soil_moisture?: number;
  fertilizer_kg_ha?: number;
}

export interface YieldPredictionResponse {
  predicted_yield_t_ha: number;
  prediction_interval: [number, number];
  confidence_level: number;
  model_version: string;
  uncertainty_method: string;
}

export interface RiskAssessmentRequest {
  region_code: string;
  crop_code: string;
  year: number;
  financial_indicators: Record<string, number>;
  climate_variables?: Record<string, number>;
  agricultural_variables?: Record<string, number>;
}

export interface RiskAssessmentResponse {
  composite_score: number;
  category: 'Low' | 'Moderate' | 'High' | 'Very High';
  risk_components: {
    agricultural_risk: number;
    climate_exposure: number;
    yield_loss_probability: number;
    financial_vulnerability: number;
  };
  prediction_interval: [number, number];
  confidence_level: number;
  expected_loss?: number;
  drivers: Array<{
    feature: string;
    importance: number;
    direction: 'positive' | 'negative';
  }>;
  model_version: string;
}

export interface ForecastRequest {
  region_code: string;
  crop_code: string;
  horizon: number;
  model?: string;
  uncertainty_method?: string;
}

export interface ForecastPoint {
  year: number;
  yield: number;
  lower_bound: number;
  upper_bound: number;
  type: 'historical' | 'forecast';
}

export interface ForecastResponse {
  historical: ForecastPoint[];
  forecast: ForecastPoint[];
  model_version: string;
  uncertainty_method: string;
  confidence_level: number;
  metrics: {
    test_mae: number;
    test_rmse: number;
    test_r2: number;
    picp_95: number;
    mpiw_95: number;
  };
}

export interface ScenarioRequest {
  region_code: string;
  crop_code: string;
  scenario: 'normal' | 'dry' | 'heat' | 'severe' | 'custom';
  custom_params?: {
    rainfall_multiplier?: number;
    temperature_offset?: number;
    crop_price_multiplier?: number;
    loan_exposure_multiplier?: number;
  };
  n_simulations?: number;
  confidence_level?: number;
}

export interface ScenarioResult {
  scenario: string;
  yield_distribution: {
    mean: number;
    std: number;
    percentiles: Record<string, number>;
  };
  yield_loss_probability: number;
  risk_score_distribution: {
    mean: number;
    std: number;
    percentiles: Record<string, number>;
  };
  expected_loss: number;
  category: 'Low' | 'Moderate' | 'High' | 'Very High';
}

export interface ScenarioResponse {
  results: ScenarioResult[];
  n_simulations: number;
  confidence_level: number;
}

export interface ExperimentRecord {
  experiment_id: string;
  name: string;
  config: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  metrics?: Record<string, number>;
}

export interface ModelCard {
  model_name: string;
  version: string;
  training_data: string;
  features: string[];
  target: string;
  training_period: string;
  validation_method: string;
  metrics: Record<string, number>;
  known_limitations: string[];
  potential_bias: string[];
  intended_use: string;
  non_intended_use: string;
}

export interface DatasetMetadata {
  dataset_name: string;
  provider: string;
  url: string;
  license: string;
  access_date: string;
  temporal_coverage: string;
  geographic_coverage: string;
  variables: Array<{
    name: string;
    unit: string;
    description: string;
  }>;
  preprocessing: string[];
  version: string;
  checksum: string;
  rows_received: number;
  rows_rejected: number;
  rows_corrected: number;
  rows_retained: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  dependencies: {
    database: 'connected' | 'disconnected';
    mlflow: 'connected' | 'disconnected';
    cache: 'connected' | 'disconnected';
  };
}
