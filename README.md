# AgRiX

An Uncertainty-Aware Statistical and Machine Learning Framework for Agricultural Credit Risk Under Climate and Yield Variability

## Overview

AgRiX is a research-oriented decision-support system that estimates agricultural financial risk by jointly considering:

- Agricultural production characteristics
- Climate and weather variability
- Historical crop yield
- Commodity/economic conditions
- Farmer/farm financial characteristics
- Predicted future agricultural conditions
- Uncertainty associated with those predictions

## Core Research Question

> **Can agricultural and climate information improve financial-risk assessment for agricultural lending when compared with financial information alone?**

## Key Features

- **Statistical Analysis Engine**: Descriptive statistics, distribution fitting, correlation analysis, hypothesis testing
- **Regression & ML Models**: Linear regression, Ridge, Lasso, Random Forest, XGBoost with proper baselines
- **Time-Aware Forecasting**: Lag features, chronological splits, prediction intervals
- **Uncertainty Quantification**: Bootstrap, quantile regression, conformal prediction, Monte Carlo scenarios
- **Risk Aggregation**: Transparent methodology combining agricultural, climate, yield-loss, and financial risk
- **Explainability**: Feature importance, SHAP values, coefficient interpretations
- **Scenario Analysis**: Normal, dry, heat, and severe climate scenarios with 1000+ simulations
- **Research-Grade Reproducibility**: Versioned datasets, features, models, experiments with full audit trail

## Architecture

```
Data Sources → Data Ingestion → Validation & Preprocessing → Feature Engineering
                                                    ↓
Statistical Models ← Yield Models ← Credit Models → Uncertainty Engine
                                                    ↓
Risk Aggregation → Scenario Engine → FastAPI Backend → Next.js Frontend
```

## Project Structure

```
AgRiX/
├── frontend/          # Next.js React application
├── backend/           # FastAPI Python backend
├── ml/                # ML pipeline and models
├── data/              # Data providers and datasets
├── experiments/       # Experiment tracking and results
├── notebooks/         # Jupyter notebooks for exploration
├── scripts/           # Utility scripts
├── tests/             # Unit, integration, property-based tests
├── docs/              # Documentation
├── .kiro/             # Kiro IDE configuration
│   ├── steering/      # Project steering files
│   ├── specs/         # Feature specifications
│   └── hooks/         # Automation hooks
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL (or SQLite for local development)

### Backend Setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000` with API docs at `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

## Research Integrity

This project adheres to strict research integrity standards:

- **No fabricated results, datasets, metrics, or citations**
- **Clear distinction between proxy risk scores and actual default probabilities**
- **Temporal leakage prevention in all forecasting tasks**
- **Interpretable baselines before complex models**
- **Full reproducibility of all experiments**

See [RESEARCH_METHODOLOGY.md](.kiro/steering/research-methodology.md) for details.

## Documentation

- [Project Report](docs/project-report.md)
- [Methodology](docs/methodology.md)
- [Dataset Documentation](docs/dataset-documentation.md)
- [Model Documentation](docs/model-documentation.md)
- [Experiment Log](docs/experiment-log.md)
- [API Documentation](docs/api-documentation.md)
- [User Manual](docs/user-manual.md)

## License

See [LICENSE](LICENSE) for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Citation

If you use AgRiX in your research, please cite:

```bibtex
@software{AgRiX2026,
  title = {AgRiX: An Uncertainty-Aware Statistical and Machine Learning Framework for Agricultural Credit Risk Under Climate and Yield Variability},
  year = {2026},
  author = {AgRiX Contributors}
}
```