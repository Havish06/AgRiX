# AgRiX Research Methodology Steering

## Core Research Principles

### 1. No Fabrication Policy
**ABSOLUTE REQUIREMENT**: Never invent, fabricate, or hallucinate:
- Datasets or data points
- Experimental results or metrics
- Statistical significance values (p-values, confidence intervals)
- Model performance numbers
- Citations or references
- Scientific claims

Every number reported must trace to actual code execution on real data.

### 2. Honest Distinction: Proxy vs. Actual Default Probability

| Concept | Requirements | Label in System |
|---------|--------------|-----------------|
| **Actual Default Probability** | Real historical default labels (loan outcome data) | `probability_of_default` |
| **Agricultural Financial Risk Score** | Proxy variables, documented assumptions | `agricultural_financial_risk_estimate` |

**The UI and all outputs must clearly distinguish these.** Never present a proxy score as an empirically observed default probability.

### 3. Temporal Integrity (No Data Leakage)

**For ALL forecasting tasks:**
- Train/validation/test splits MUST be chronological
- **Correct**: `2010-2018 train | 2019-2021 val | 2022-2024 test`
- **Incorrect**: Random shuffle, future data in training
- All preprocessing (scaling, encoding, imputation) fitted ONLY on training data
- Lag features only use t-k where k > 0

**Leakage Audit Checklist** (run before final results):
- [ ] No future weather variables in training features
- [ ] No future crop yield in training features
- [ ] No future financial information in training features
- [ ] No target-derived variables
- [ ] No post-outcome variables
- [ ] No duplicate records across train/test
- [ ] Preprocessing transformers fitted on train only

### 4. Baseline-First Model Selection

**Required progression:**
```
Mean/Median Baseline
    ↓
Simple Statistical Model (Linear Regression)
    ↓
Regularized Linear (Ridge/Lasso/ElasticNet)
    ↓
Classical ML (Random Forest, Gradient Boosting)
    ↓
Advanced ML (XGBoost, LightGBM)
    ↓
Deep Learning (LSTM/Transformer) ONLY IF:
    - Data volume > 10,000 samples
    - Temporal structure justifies sequence modeling
    - Simpler models demonstrably insufficient
    - Computational budget allows
```

**If Linear Regression performs competitively, that IS the result.** Do not hide it.

### 5. Uncertainty Quantification Required

Every prediction MUST include:
- Point estimate
- Prediction interval (lower, upper)
- Confidence level (default 95%)
- Method used (bootstrap, quantile regression, conformal, etc.)

**Acceptable methods:**
- Bootstrap prediction intervals (preferred for small/medium data)
- Quantile regression forests
- Conformal prediction (distribution-free)
- Monte Carlo dropout (for neural nets only)
- Analytical intervals (for linear models with assumptions met)

### 6. Statistical Rigor

#### Hypothesis Testing
- Select test based on assumptions (normality, variance homogeneity, independence)
- **Default**: Welch's t-test (unequal variance), Mann-Whitney U (non-parametric)
- Report: test statistic, p-value, effect size, confidence interval
- Adjust for multiple comparisons (Bonferroni, Benjamini-Hochberg)
- Pre-register hypotheses where possible

#### Distribution Fitting
- Visual diagnostics (Q-Q plots, histogram vs fitted density)
- Goodness-of-fit tests (KS, Anderson-Darling, Chi-square)
- Information criteria (AIC, BIC) for model selection
- Domain reasoning for distribution choice
- **Never force Normal distribution without justification**

#### Correlation Analysis
- Pearson (linear, normal) + Spearman (monotonic, robust)
- Report confidence intervals for correlations
- Partial correlation where confounding suspected
- Correlation ≠ causation (explicitly stated)

### 7. Model Evaluation Standards

#### Regression Metrics (report ALL)
- MAE (Mean Absolute Error)
- RMSE (Root Mean Squared Error)
- R² (Coefficient of Determination)
- MAPE (Mean Absolute Percentage Error) - only if y > 0
- **Prediction Interval Coverage Probability (PICP)**
- **Mean Prediction Interval Width (MPIW)**

#### Classification Metrics (if classification used)
- Accuracy (with class balance context)
- Precision, Recall, F1 (per class + macro/micro)
- ROC-AUC, PR-AUC (PR-AUC for imbalanced)
- Calibration error (ECE, MCE)
- Confusion matrix

#### Comparison Protocol
- Same train/val/test splits for all models
- Same preprocessing pipeline
- Statistical significance of difference (paired t-test, Wilcoxon)
- Report variance across random seeds (min 5 seeds)

### 8. Explainability Requirements

Every model MUST provide:
- **Global**: Feature importance (permutation, SHAP summary)
- **Local**: Per-prediction explanation (SHAP force, coefficients)
- **Partial dependence** for key continuous features
- **Interaction effects** where domain-relevant

**No fake explanations.** Explanation must correspond to actual model.

### 9. Experiment Tracking & Reproducibility

**Every experiment logs:**
```python
experiment_record = {
    "experiment_id": "uuid",
    "dataset_version": "hash",
    "feature_version": "hash",
    "model_type": "LinearRegression|RandomForest|XGBoost",
    "hyperparameters": {...},
    "random_seed": 42,
    "train_period": "2010-2018",
    "validation_period": "2019-2021",
    "test_period": "2022-2024",
    "metrics": {...},
    "uncertainty_method": "bootstrap|conformal|quantile",
    "timestamp": "ISO8601",
    "git_commit": "sha",
    "environment": "conda-lock.yml or pip freeze"
}
```

**Reproducibility test**: Re-run from experiment record → identical metrics (± numerical precision)

### 10. Randomness Control

```python
# Global seed management
RANDOM_SEED = 42

# Set at experiment start
np.random.seed(RANDOM_SEED)
random.seed(RANDOM_SEED)
torch.manual_seed(RANDOM_SEED)  # if using PyTorch
tf.random.set_seed(RANDOM_SEED)  # if using TensorFlow

# For sklearn models
model = RandomForestRegressor(random_state=RANDOM_SEED, ...)

# For cross-validation
cv = KFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)

# For train_test_split
train_test_split(..., random_state=RANDOM_SEED)
```

**Never scatter random seeds.** Centralize in config.

### 11. Data Documentation (Data Cards)

Every dataset version documents:
```yaml
dataset_name: "FAOSTAT_Crop_Yield"
provider: "FAO"
url: "https://fenixservices.fao.org/faostat/api/v1"
license: "CC BY 4.0"
access_date: "2026-01-15"
temporal_coverage: "1961-2022"
geographic_coverage: "245 countries/territories"
variables:
  - name: "yield_tonnes_per_hectare"
    unit: "t/ha"
    description: "Crop yield per harvested hectare"
preprocessing:
  - "Removed records with area_harvested <= 0"
  - "Winsorized yield at 1st/99th percentile per crop"
  - "Aligned to ISO 3166-1 alpha-3 country codes"
version: "v1.2.0"
checksum: "sha256:..."
```

### 12. Model Cards

Every production model documents:
```yaml
model_name: "Yield_XGBoost_v3"
version: "3.1.0"
training_data: "FAOSTAT_Crop_Yield_v1.2.0 + ERA5_Climate_v2.0.1"
features: 
  - "rainfall_mm"
  - "temperature_c"
  - "soil_moisture"
  - "fertilizer_kg_ha"
  - "lag_yield_1"
  - "lag_yield_2"
target: "yield_tonnes_per_hectare"
training_period: "1961-2018"
validation_method: "TimeSeriesSplit(n_splits=5)"
metrics:
  test_mae: 0.31
  test_rmse: 0.42
  test_r2: 0.83
  picp_95: 0.94
  mpiw_95: 1.2
known_limitations:
  - "Extrapolation beyond observed climate range unreliable"
  - "Limited data for minor crops (< 500 observations)"
  - "No pest/disease variables included"
potential_bias:
  - "Overrepresentation of major cereal crops"
  - "Better performance in temperate vs tropical regions"
intended_use: "Agricultural yield forecasting for risk assessment"
non_intended_use: "Precision agriculture field-level decisions"
```

### 13. Fairness & Bias Analysis

Where demographic/regional variables involved:
- **Geographic bias**: Performance across regions/countries
- **Data availability bias**: Regions with more data may have better models
- **Socioeconomic bias**: Proxy variables may correlate with protected attributes
- **Crop-specific bias**: Major vs minor crops
- **Temporal bias**: Model performance may degrade under climate change

**Do not claim "fairness" from attribute exclusion alone.** Analyze outcomes.

### 14. Limitations Documentation

**Required in final report:**
- Data limitations (coverage, quality, representativeness)
- Model assumptions (linearity, stationarity, independence)
- Extrapolation risks (future climate ≠ historical)
- Proxy variable validity (risk score ≠ default probability)
- Computational constraints
- Scope boundaries (crops, regions, time periods covered)

---

## Central Research Experiment

**Primary Comparison:**
```
Model A: Financial features only
    VS
Model B: Financial + Agricultural + Climate features
```

**Evaluation:**
- Same temporal splits
- Same evaluation metrics
- Statistical test of difference (Diebold-Mariano for forecasts, paired t-test for cross-section)
- Effect size reporting
- Subgroup analysis (by crop, region, climate zone)

**This experiment forms the core of the research contribution.**

---

## Publication Standards

If results warrant publication:
- Target venue determines structure (IEEE, Nature, JASA, etc.)
- **Do not optimize for publication** - optimize for scientific correctness
- Pre-registration encouraged for confirmatory experiments
- Data and code availability statement required
- Author contributions specified
- Conflict of interest declared

**Manuscript structure follows target venue, but minimum:**
1. Abstract (structured: Problem, Gap, Method, Data, Results, Contribution)
2. Introduction with clear research questions
3. Related work with gap identification
4. Methodology (reproducible detail)
5. Data description with limitations
6. Experimental setup
7. Results (with uncertainty, not just point estimates)
8. Discussion (not just interpretation - include limitations)
9. Conclusion with practical significance

---

## Forbidden Practices

❌ **Never**:
- P-hacking (trying multiple tests until significant)
- HARKing (hypothesizing after results known)
- Test set optimization (tuning on test data)
- Cherry-picking results
- Omitting failed experiments
- Claiming causation from correlation
- Presenting proxy as ground truth
- Using future data in training
- Reporting metrics without uncertainty
- Using accuracy alone for imbalanced risk data
- Adding complexity without demonstrated improvement
- Fabricating any result, ever

---

## Quality Gates

**Before any result is considered final:**
1. [ ] Leakage audit passed
2. [ ] Baseline comparison completed
3. [ ] Uncertainty quantified
4. [ ] Explainability generated
5. [ ] Statistical tests appropriate
6. [ ] Multiple seeds evaluated
7. [ ] Limitations documented
8. [ ] Experiment logged with full config
9. [ ] Reproducibility verified (re-run from log)
10. [ ] Code reviewed for correctness