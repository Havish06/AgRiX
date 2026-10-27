# User Manual

## Start the application

1. **Backend** — from `backend/`:
   ```
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
   On Windows hosts where Smart App Control blocks scientific DLLs, run the
   backend inside WSL instead (`wsl -d Ubuntu`, then the same commands).
2. **Frontend** — from `frontend/`:
   ```
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000`. The API is served from
   `http://localhost:8000`.

## First run: load data and train models

Analysis pages show an explicit "pipeline not run yet" state until data and
models exist. Trigger it once, either:

- from the **Settings** page (run-pipeline button), or
- directly: `POST http://localhost:8000/api/pipeline/run`.

The pipeline ingests NASA POWER climate data and FAOSTAT/World Bank yield
data, builds the synthetic credit panel, and trains the 20-model zoo. It takes
a few minutes; progress is returned in the response and the state persists on
disk, so this is only needed once per environment.

## Pages

### Landing
Project identity, research question, capability overview, and the entry point
to the dashboard.

### Dashboard
The current-analysis overview: predicted yield with its uncertainty interval,
composite risk category, top risk drivers, and a yield forecast chart fed by
live API responses — nothing hard-coded.

### Analysis
The statistical workspace. Select a dataset to get summary statistics, fitted
distribution diagnostics, the correlation matrix, and two-group hypothesis
tests, all computed by the backend statistics service.

### Forecast
Historical yield alongside the multi-year forecast with 95% prediction
intervals. Horizon is selectable (1–10 years); intervals come from the
trend + residual bootstrap, not a fixed formula.

### Scenarios
Choose a preset (Normal, Dry, Heat, Severe) or Custom, adjust rainfall,
temperature, crop price, and loan exposure with sliders, and run the Monte
Carlo engine (100–10,000 simulations). Outputs: yield distribution, yield-loss
probability, risk-score distribution, expected loss, and the risk category —
all derived from actual model outputs.

### Model Lab
Side-by-side comparison of every trained model (MAE, RMSE, R², PICP, MPIW),
read directly from the model registry for the selected task and feature set.

### Research
The experiment history and model cards: features, target, seed, training/test
periods, metrics, and the synthetic-data flag for the financial task.

### Settings
Pipeline controls (run ingestion + training), dataset source status, and
environment info.

## Interpreting results

- Every point estimate ships with a 95% interval. Wide intervals are a
  finding, not a defect.
- Financial results are labelled **synthetic** everywhere they appear. They
  are agricultural financial-risk *estimates*, never default probabilities.
- A 503 response means the pipeline has not been run in this environment —
  run it rather than retrying.
- A 422 response means the request payload contains unknown or missing fields;
  the response body names the offending field.