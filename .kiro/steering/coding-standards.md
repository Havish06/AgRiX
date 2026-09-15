# AgRiX Coding Standards

## General Principles

- **Clarity over cleverness**: Code should be readable by researchers, not just engineers
- **Explicit over implicit**: No magic, no hidden behavior
- **Testable by default**: Every non-trivial function has tests
- **Reproducible**: Deterministic outputs with fixed seeds
- **Domain-driven**: Code structure reflects agricultural/financial/climate domains

---

## Python Standards (Backend/ML)

### Version & Tooling
- Python 3.11+
- Type hints required (mypy strict mode)
- Ruff for linting/formatting (replaces black, isort, flake8)
- Pydantic v2 for validation/serialization

### Project Structure
```
backend/
├── app/
│   ├── api/           # FastAPI routes (thin)
│   ├── core/          # Config, security, database
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic request/response models
│   ├── services/      # Business logic (domain services)
│   ├── statistics/    # Statistical analysis module
│   ├── forecasting/   # Time-series forecasting
│   ├── risk/          # Risk aggregation engine
│   ├── uncertainty/   # Uncertainty quantification
│   ├── data/          # Data providers, validation, preprocessing
│   └── main.py        # Application entry point
├── tests/
├── scripts/
└── pyproject.toml
```

### Type Hints (Required)

```python
# Good
def calculate_yield_risk(
    rainfall: np.ndarray,
    temperature: np.ndarray,
    historical_yield: np.ndarray,
    confidence_level: float = 0.95
) -> tuple[float, tuple[float, float]]:
    ...

# Bad - no types
def calculate_yield_risk(rainfall, temperature, historical_yield, confidence_level=0.95):
    ...
```

### Pydantic Models for API Contracts

```python
# schemas/yield.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Annotated
from datetime import date

class YieldPredictionRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    region_code: Annotated[str, Field(pattern=r'^[A-Z]{2,3}$')]
    crop_code: Annotated[str, Field(min_length=1, max_length=20)]
    year: Annotated[int, Field(ge=1960, le=2030)]
    rainfall_mm: Annotated[float, Field(ge=0)]
    temperature_c: Annotated[float, Field(ge=-50, le=60)]
    soil_moisture: Annotated[float, Field(ge=0, le=1)] | None = None
    fertilizer_kg_ha: Annotated[float, Field(ge=0)] | None = None

class YieldPredictionResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    predicted_yield_t_ha: float
    prediction_interval: tuple[float, float]
    confidence_level: float
    model_version: str
    uncertainty_method: str
```

### Service Layer Pattern (Domain Logic Separated from HTTP)

```python
# services/yield_service.py
from app.statistics.regression import LinearRegressionModel
from app.uncertainty.bootstrap import BootstrapPredictionInterval
from app.schemas.yield import YieldPredictionRequest, YieldPredictionResponse

class YieldService:
    def __init__(
        self,
        model: LinearRegressionModel,
        uncertainty_engine: BootstrapPredictionInterval
    ):
        self.model = model
        self.uncertainty = uncertainty_engine
    
    def predict(self, request: YieldPredictionRequest) -> YieldPredictionResponse:
        features = self._prepare_features(request)
        prediction = self.model.predict(features)
        lower, upper = self.uncertainty.compute(
            self.model, features, confidence=0.95
        )
        return YieldPredictionResponse(
            predicted_yield_t_ha=prediction,
            prediction_interval=(lower, upper),
            confidence_level=0.95,
            model_version=self.model.version,
            uncertainty_method="bootstrap"
        )
    
    def _prepare_features(self, request: YieldPredictionRequest) -> np.ndarray:
        ...
```

### Statistical/ML Code Standards

```python
# statistics/regression.py
import numpy as np
from numpy.typing import NDArray
from dataclasses import dataclass

@dataclass(frozen=True)
class RegressionResult:
    coefficients: NDArray[np.float64]
    intercept: float
    r_squared: float
    adj_r_squared: float
    p_values: NDArray[np.float64]
    std_errors: NDArray[np.float64]
    confidence_intervals: NDArray[np.float64]  # shape (n_features, 2)
    residuals: NDArray[np.float64]
    n_observations: int
    feature_names: list[str]

class LinearRegressionModel:
    """Ordinary Least Squares with full statistical inference."""
    
    def __init__(self, random_seed: int = 42):
        self.random_seed = random_seed
        self._fitted = False
    
    def fit(
        self,
        X: NDArray[np.float64],
        y: NDArray[np.float64],
        feature_names: list[str] | None = None
    ) -> RegressionResult:
        # Validate inputs
        X, y = self._validate_inputs(X, y)
        
        # Fit OLS
        X_design = np.column_stack([np.ones(X.shape[0]), X])
        beta = np.linalg.lstsq(X_design, y, rcond=None)[0]
        
        self.intercept = float(beta[0])
        self.coefficients = beta[1:]
        self.feature_names = feature_names or [f"x{i}" for i in range(X.shape[1])]
        self._fitted = True
        
        # Compute statistics
        return self._compute_statistics(X, y)
    
    def _validate_inputs(self, X: NDArray, y: NDArray) -> tuple[NDArray, NDArray]:
        if X.ndim != 2:
            raise ValueError(f"X must be 2D, got {X.ndim}D")
        if y.ndim != 1:
            raise ValueError(f"y must be 1D, got {y.ndim}D")
        if X.shape[0] != y.shape[0]:
            raise ValueError(f"X and y length mismatch: {X.shape[0]} vs {y.shape[0]}")
        if np.any(np.isnan(X)) or np.any(np.isnan(y)):
            raise ValueError("Inputs contain NaN values")
        return X, y
    
    def predict(self, X: NDArray[np.float64]) -> NDArray[np.float64]:
        if not self._fitted:
            raise RuntimeError("Model not fitted")
        return X @ self.coefficients + self.intercept
```

### Constants Centralization

```python
# core/constants.py
from enum import Enum

class RiskCategory(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    VERY_HIGH = "Very High"

RISK_THRESHOLDS = {
    RiskCategory.LOW: (0.00, 0.24),
    RiskCategory.MODERATE: (0.25, 0.49),
    RiskCategory.HIGH: (0.50, 0.74),
    RiskCategory.VERY_HIGH: (0.75, 1.00),
}

DEFAULT_CONFIDENCE_LEVEL = 0.95
DEFAULT_RANDOM_SEED = 42
MIN_OBSERVATIONS_FOR_REGRESSION = 30
MAX_MISSING_FRACTION = 0.1
```

### Error Handling

```python
# core/exceptions.py
class AgRiXError(Exception):
    """Base exception for AgRiX."""
    def __init__(self, message: str, code: str, details: dict | None = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(message)

class ValidationError(AgRiXError):
    def __init__(self, message: str, field: str, value: any):
        super().__init__(message, "VALIDATION_ERROR", {"field": field, "value": str(value)})

class DataLeakageError(AgRiXError):
    def __init__(self, message: str, details: dict):
        super().__init__(message, "DATA_LEAKAGE", details)

class ModelNotFittedError(AgRiXError):
    def __init__(self, model_name: str):
        super().__init__(
            f"Model {model_name} has not been fitted",
            "MODEL_NOT_FITTED",
            {"model": model_name}
        )
```

### Testing Standards

```python
# tests/statistics/test_regression.py
import pytest
import numpy as np
from hypothesis import given, strategies as st
from app.statistics.regression import LinearRegressionModel, RegressionResult

class TestLinearRegression:
    @pytest.fixture
    def model(self):
        return LinearRegressionModel(random_seed=42)
    
    @pytest.fixture
    def simple_data(self):
        np.random.seed(42)
        X = np.random.randn(100, 2)
        y = 2.0 * X[:, 0] - 1.5 * X[:, 1] + 0.5 + np.random.randn(100) * 0.1
        return X, y
    
    def test_fit_returns_result(self, model, simple_data):
        X, y = simple_data
        result = model.fit(X, y, feature_names=["x1", "x2"])
        
        assert isinstance(result, RegressionResult)
        assert result.n_observations == 100
        assert len(result.coefficients) == 2
        assert result.r_squared > 0.9  # Strong signal
    
    def test_predict_before_fit_raises(self, model):
        with pytest.raises(ModelNotFittedError):
            model.predict(np.array([[1.0, 2.0]]))
    
    # Property-based test
    @given(
        st.lists(st.floats(-10, 10), min_size=10, max_size=100),
        st.lists(st.floats(-10, 10), min_size=10, max_size=100),
    )
    def test_residuals_sum_to_zero(self, x_vals, y_vals):
        # Only test when lengths match
        if len(x_vals) != len(y_vals):
            return
        
        X = np.array(x_vals).reshape(-1, 1)
        y = np.array(y_vals)
        
        model = LinearRegressionModel()
        result = model.fit(X, y)
        
        # OLS residuals sum to zero (with intercept)
        assert abs(result.residuals.sum()) < 1e-10
```

### Imports Organization

```python
# Standard library
import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Annotated

# Third party
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field
from sqlalchemy import select

# Local
from app.core.config import settings
from app.core.exceptions import ValidationError
from app.schemas.yield import YieldPredictionRequest
```

---

## TypeScript Standards (Frontend)

### Version & Tooling
- TypeScript 5+ (strict mode)
- ESLint + Prettier
- React 18+ with Next.js 14 App Router

### Project Structure
```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Route groups
│   ├── api/                # API route handlers (proxy)
│   └── layout.tsx
├── components/
│   ├── ui/                 # Base UI components (Button, Card, Input)
│   ├── charts/             # Chart components
│   ├── forms/              # Form components
│   └── layout/             # Header, Sidebar, Footer
├── features/               # Feature-based modules
│   ├── dashboard/
│   ├── analysis/
│   ├── forecast/
│   ├── scenarios/
│   └── model-lab/
├── lib/
│   ├── api/                # API client (TanStack Query)
│   ├── utils/              # Utility functions
│   ├── constants/          # Shared constants
│   └── validations/        # Zod schemas
├── hooks/                  # Custom React hooks
├── services/               # Domain services (if needed)
├── types/                  # TypeScript types (mirrors Pydantic)
├── styles/                 # Global styles, CSS variables
└── middleware.ts
```

### Type Safety

```typescript
// types/yield.ts - mirrors backend Pydantic models
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

// Zod schema for runtime validation
import { z } from 'zod';

export const yieldPredictionRequestSchema = z.object({
  region_code: z.string().regex(/^[A-Z]{2,3}$/),
  crop_code: z.string().min(1).max(20),
  year: z.number().int().min(1960).max(2030),
  rainfall_mm: z.number().min(0),
  temperature_c: z.number().min(-50).max(60),
  soil_moisture: z.number().min(0).max(1).optional(),
  fertilizer_kg_ha: z.number().min(0).optional(),
});

export type YieldPredictionRequestInput = z.infer<typeof yieldPredictionRequestSchema>;
```

### API Client (TanStack Query)

```typescript
// lib/api/yield.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { yieldApi } from './client';
import type { YieldPredictionRequest, YieldPredictionResponse } from '@/types/yield';

export function useYieldPrediction(request: YieldPredictionRequest) {
  return useQuery({
    queryKey: ['yield-prediction', request],
    queryFn: () => yieldApi.predict(request),
    enabled: !!request.region_code && !!request.crop_code,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useYieldForecast(regionCode: string, cropCode: string, horizon: number) {
  return useQuery({
    queryKey: ['yield-forecast', regionCode, cropCode, horizon],
    queryFn: () => yieldApi.forecast(regionCode, cropCode, horizon),
  });
}

// lib/api/client.ts
import { fetchWrapper } from './fetch-wrapper';
import { env } from '@/lib/constants/env';

const API_BASE = env.NEXT_PUBLIC_API_URL;

export const yieldApi = {
  predict: (request: YieldPredictionRequest): Promise<YieldPredictionResponse> =>
    fetchWrapper(`${API_BASE}/api/predictions/yield`, {
      method: 'POST',
      body: JSON.stringify(request),
    }),
  
  forecast: (region: string, crop: string, horizon: number) =>
    fetchWrapper(`${API_BASE}/api/forecast`, {
      method: 'POST',
      body: JSON.stringify({ region_code: region, crop_code: crop, horizon }),
    }),
};
```

### Component Patterns

```typescript
// components/charts/YieldChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { YieldForecastPoint } from '@/types/forecast';

interface YieldChartProps {
  data: YieldForecastPoint[];
  historicalData?: YieldForecastPoint[];
  onPointClick?: (point: YieldForecastPoint) => void;
}

export function YieldChart({ data, historicalData, onPointClick }: YieldChartProps) {
  const chartData = [
    ...(historicalData?.map(d => ({ ...d, type: 'historical' as const })) ?? []),
    ...data.map(d => ({ ...d, type: 'forecast' as const })),
  ].sort((a, b) => a.year - b.year);

  return (
    <div className="chart-container" role="img" aria-label="Yield forecast chart">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis 
            dataKey="year" 
            tick={{ fill: 'var(--color-text-muted)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis 
            tick={{ fill: 'var(--color-text-muted)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            label={{ value: 'Yield (t/ha)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
            }}
            labelStyle={{ color: 'var(--color-text)' }}
          />
          <Line
            type="monotone"
            dataKey="yield"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            onClick={onPointClick}
          />
          <Line
            type="monotone"
            dataKey="lower_bound"
            stroke="var(--color-primary)"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            opacity={0.5}
          />
          <Line
            type="monotone"
            dataKey="upper_bound"
            stroke="var(--color-primary)"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            opacity={0.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### CSS Variables for Skeuomorphic Theme

```css
/* styles/globals.css */
:root {
  /* Warm parchment/ivory backgrounds */
  --color-background: #faf8f3;
  --color-surface: #fefefb;
  --color-surface-elevated: #ffffff;
  
  /* Text colors */
  --color-text: #2d2926;
  --color-text-muted: #6b645c;
  --color-text-light: #9a9288;
  
  /* Primary: Deep forest green */
  --color-primary: #2d4a2b;
  --color-primary-hover: #1e351d;
  --color-primary-light: #e8efe7;
  
  /* Supporting: Dark olive, charcoal, muted brown */
  --color-olive: #556b2f;
  --color-charcoal: #363330;
  --color-brown: #8b7355;
  
  /* Risk colors */
  --color-risk-low: #2d4a2b;
  --color-risk-moderate: #b8860b;
  --color-risk-high: #cd5c5c;
  --color-risk-very-high: #8b0000;
  
  /* Borders & shadows */
  --color-border: #d4cec7;
  --color-border-strong: #b8b0a5;
  --shadow-inset: inset 2px 2px 4px rgba(0,0,0,0.08), inset -2px -2px 4px rgba(255,255,255,0.6);
  --shadow-raised: 2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.6);
  --shadow-deep: 4px 4px 8px rgba(0,0,0,0.12), -4px -4px 8px rgba(255,255,255,0.5);
  
  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: 0ms;
    --transition-normal: 0ms;
    --transition-slow: 0ms;
  }
}

/* Skeuomorphic component base classes */
.panel-inset {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-inset);
  border-radius: 4px;
}

.panel-raised {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-raised);
  border-radius: 4px;
}

.panel-deep {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-deep);
  border-radius: 4px;
}

.btn-raised {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-raised);
  padding: 8px 16px;
  border-radius: 4px;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-raised:hover {
  box-shadow: var(--shadow-deep);
  transform: translateY(-1px);
}

.btn-raised:active {
  box-shadow: var(--shadow-inset);
  transform: translateY(0);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-surface);
  border: none;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}
```

---

## Git Standards

### Commit Messages (Conventional Commits)

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `research`

Examples:
```
feat(statistics): add gamma distribution fitting with AIC selection

fix(forecast): prevent temporal leakage in lag feature generation

research(experiment): add finance-only vs combined model comparison

docs(methodology): document uncertainty quantification approach
```

### Branch Protection

- Main branch protected
- PR required for all changes
- CI must pass (lint, typecheck, tests)
- No direct pushes to main

---

## Documentation Standards

- **Docstrings**: NumPy style for all public functions/classes
- **README**: Updated for user-facing changes
- **API docs**: Auto-generated from Pydantic/OpenAPI
- **Methodology**: Updated for research changes
- **Experiment log**: Every experiment recorded

```python
def fit_gamma_distribution(
    data: NDArray[np.float64],
    method: Literal["mle", "moments"] = "mle"
) -> GammaFitResult:
    """
    Fit a gamma distribution to positive continuous data.
    
    Parameters
    ----------
    data : NDArray[np.float64]
        Observed values. Must be strictly positive.
    method : {"mle", "moments"}, default="mle"
        Estimation method. MLE is preferred for statistical efficiency.
    
    Returns
    -------
    GammaFitResult
        Fitted parameters (shape, scale), log-likelihood, AIC, BIC,
        and goodness-of-fit test results.
    
    Raises
    ------
    ValidationError
        If data contains non-positive values.
    
    References
    ----------
    .. [1] Johnson, N. L., Kotz, S., & Balakrishnan, N. (1994).
       Continuous Univariate Distributions, Volume 1. Wiley.
    """
```

---

## Code Review Checklist

- [ ] Types present and correct
- [ ] Tests added for new logic
- [ ] No hardcoded values (use constants)
- [ ] No broad exception handling
- [ ] Domain logic separated from framework code
- [ ] Mathematical assumptions documented
- [ ] No data leakage in ML code
- [ ] Uncertainty quantified for predictions
- [ ] Explainability output for models
- [ ] Performance acceptable (no N+1 queries)
- [ ] Accessibility considered (frontend)
- [ ] Reduced motion respected (frontend)