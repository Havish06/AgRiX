import { env } from '@/lib/constants/env';
import type {
  DatasetMetadata,
  ExperimentRecord,
  ForecastRequest,
  ForecastResponse,
  HealthResponse,
  ModelCard,
  ModelComparisonResponse,
  RiskAssessmentRequest,
  RiskAssessmentResponse,
  ScenarioRequest,
  ScenarioResponse,
  YieldPredictionRequest,
  YieldPredictionResponse,
  AdvisoryRequest,
  AdvisoryResponse,
} from '@/types';

const API_BASE = env.NEXT_PUBLIC_API_URL;

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWrapper<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData: {
      message?: string;
      detail?: string;
      code?: string;
      details?: Record<string, unknown>;
    } = {};
    try {
      const parsed: typeof errorData = await response.json();
      // FastAPI reports errors as { detail }; normalise to { message } so the
      // UI shows the backend's explanation instead of a bare status line.
      if (typeof parsed?.detail === 'string') {
        parsed.message = parsed.message ?? parsed.detail;
      }
      errorData = parsed;
    } catch {
      // Ignore JSON parse errors
    }

    throw new ApiError(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData.code,
      errorData.details
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  // Health
  health: () => fetchWrapper<HealthResponse>('/api/health'),

  // Pipeline
  runPipeline: () =>
    fetchWrapper<{
      status: string;
      ingestion: Record<string, unknown>;
      models_trained: number;
    }>('/api/pipeline/run', { method: 'POST' }),

  // Data
  listDatasets: () => fetchWrapper<DatasetMetadata[]>('/api/datasets'),
  getDatasetSummary: (params: Record<string, string>) =>
    fetchWrapper<unknown>(`/api/data/summary?${new URLSearchParams(params)}`),
  validateData: (data: unknown) =>
    fetchWrapper<unknown>('/api/data/validate', { method: 'POST', body: JSON.stringify(data) }),

  // Statistics
  getStatisticsSummary: (params: Record<string, string>) =>
    fetchWrapper<unknown>(`/api/statistics/summary?${new URLSearchParams(params)}`),
  getDistribution: (params: Record<string, string>) =>
    fetchWrapper<unknown>(`/api/statistics/distribution?${new URLSearchParams(params)}`),
  getCorrelation: (params: Record<string, string>) =>
    fetchWrapper<unknown>(`/api/statistics/correlation?${new URLSearchParams(params)}`),
  runHypothesisTest: (data: unknown) =>
    fetchWrapper<unknown>('/api/statistics/hypothesis', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Models
  trainModel: (config: unknown) =>
    fetchWrapper<unknown>('/api/models/train', { method: 'POST', body: JSON.stringify(config) }),
  evaluateModel: (params: Record<string, string>) =>
    fetchWrapper<unknown>(`/api/models/evaluate?${new URLSearchParams(params)}`),
  listModels: () => fetchWrapper<ModelCard[]>('/api/models/list'),
  getModelComparison: () => fetchWrapper<ModelComparisonResponse>('/api/models/comparison'),

  // Predictions
  predictYield: (request: YieldPredictionRequest) =>
    fetchWrapper<YieldPredictionResponse>('/api/predictions/yield', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
  predictRisk: (request: RiskAssessmentRequest) =>
    fetchWrapper<RiskAssessmentResponse>('/api/predictions/risk', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  // Forecast
  forecast: (request: ForecastRequest) =>
    fetchWrapper<ForecastResponse>('/api/forecast', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  // Scenarios
  runScenario: (request: ScenarioRequest) =>
    fetchWrapper<ScenarioResponse>('/api/scenarios', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  // Explanations
  getExplanations: (data: { registry_key?: string }) =>
    fetchWrapper<unknown>('/api/explanations', { method: 'POST', body: JSON.stringify(data) }),

  // Research
  listExperiments: () => fetchWrapper<ExperimentRecord[]>('/api/research/experiments'),

  // Advisory
  getAdvisory: (request: AdvisoryRequest) =>
    fetchWrapper<AdvisoryResponse>('/api/advisory', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};

export { ApiError };
