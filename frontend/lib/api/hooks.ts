import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  YieldPredictionRequest,
  RiskAssessmentRequest,
  ForecastRequest,
  ScenarioRequest,
} from '@/types';

const queryKeys = {
  health: ['health'] as const,
  datasets: ['datasets'] as const,
  datasetSummary: (params: Record<string, string>) => ['datasets', 'summary', params] as const,
  statisticsSummary: (params: Record<string, string>) => ['statistics', 'summary', params] as const,
  distribution: (params: Record<string, string>) => ['statistics', 'distribution', params] as const,
  correlation: (params: Record<string, string>) => ['statistics', 'correlation', params] as const,
  models: ['models'] as const,
  modelEvaluation: (params: Record<string, string>) => ['models', 'evaluate', params] as const,
  yieldPrediction: (request: YieldPredictionRequest) => ['predictions', 'yield', request] as const,
  riskPrediction: (request: RiskAssessmentRequest) => ['predictions', 'risk', request] as const,
  forecast: (request: ForecastRequest) => ['forecast', request] as const,
  scenarios: (request: ScenarioRequest) => ['scenarios', request] as const,
  experiments: ['experiments'] as const,
} as const;

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: api.health,
    refetchInterval: 30000,
  });
}

export function useDatasets() {
  return useQuery({
    queryKey: queryKeys.datasets,
    queryFn: api.listDatasets,
  });
}

export function useDatasetSummary(params: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.datasetSummary(params),
    queryFn: () => api.getDatasetSummary(params),
    enabled: Object.keys(params).length > 0,
  });
}

export function useStatisticsSummary(params: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.statisticsSummary(params),
    queryFn: () => api.getStatisticsSummary(params),
    enabled: Object.keys(params).length > 0,
  });
}

export function useDistribution(params: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.distribution(params),
    queryFn: () => api.getDistribution(params),
    enabled: Object.keys(params).length > 0,
  });
}

export function useCorrelation(params: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.correlation(params),
    queryFn: () => api.getCorrelation(params),
    enabled: Object.keys(params).length > 0,
  });
}

export function useModels() {
  return useQuery({
    queryKey: queryKeys.models,
    queryFn: api.listModels,
  });
}

export function useModelEvaluation(params: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.modelEvaluation(params),
    queryFn: () => api.evaluateModel(params),
    enabled: Object.keys(params).length > 0,
  });
}

export function useYieldPrediction(request: YieldPredictionRequest) {
  return useQuery({
    queryKey: queryKeys.yieldPrediction(request),
    queryFn: () => api.predictYield(request),
    enabled: !!request.region_code && !!request.crop_code,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRiskPrediction(request: RiskAssessmentRequest) {
  return useQuery({
    queryKey: queryKeys.riskPrediction(request),
    queryFn: () => api.predictRisk(request),
    enabled: !!request.region_code && !!request.crop_code,
    staleTime: 5 * 60 * 1000,
  });
}

export function useForecast(request: ForecastRequest) {
  return useQuery({
    queryKey: queryKeys.forecast(request),
    queryFn: () => api.forecast(request),
    enabled: !!request.region_code && !!request.crop_code,
    staleTime: 5 * 60 * 1000,
  });
}

export function useScenario(request: ScenarioRequest) {
  return useQuery({
    queryKey: queryKeys.scenarios(request),
    queryFn: () => api.runScenario(request),
    enabled: !!request.region_code && !!request.crop_code,
    staleTime: 10 * 60 * 1000,
  });
}

export function useExperiments() {
  return useQuery({
    queryKey: queryKeys.experiments,
    queryFn: api.listExperiments,
  });
}

// Mutations
export function useRunPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.runPipeline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets });
      queryClient.invalidateQueries({ queryKey: queryKeys.models });
      queryClient.invalidateQueries({ queryKey: queryKeys.experiments });
      queryClient.invalidateQueries({ queryKey: queryKeys.health });
    },
  });
}

export function useTrainModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.trainModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.models });
      queryClient.invalidateQueries({ queryKey: queryKeys.experiments });
    },
  });
}

export function useRunScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.runScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });
}
