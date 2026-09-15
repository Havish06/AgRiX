# AgRiX Product Steering

## Project Identity

**AgRiX** is an uncertainty-aware statistical and machine learning framework for agricultural credit risk under climate and yield variability.

This is a **research-oriented software project**, not a simple ML demo or generic dashboard.

## Core Purpose

Transform raw agricultural, climatic, and financial data into:
1. Statistical understanding of relationships
2. Predictions with quantified uncertainty
3. Forecasts with prediction intervals
4. Scenario analysis under climate stress
5. Actionable agricultural financial-risk assessments

## Target Questions

The system must answer:
> **"Given the agricultural, climatic and financial conditions, how exposed is this agricultural loan to future yield and repayment risk?"**

Not merely:
> "What is the predicted crop yield?"

## Required Outputs

- Expected crop yield
- Yield uncertainty (prediction intervals)
- Climate-risk indicators
- Agricultural loss probability
- Financial-risk indicators
- Estimated repayment/default risk (where labeled data exists)
- Expected financial loss
- Overall risk category
- Explanation of important contributing factors
- Future scenario analysis

## Research Questions

1. **RQ1**: How strongly are climatic variables associated with crop yield?
2. **RQ2**: Which agricultural and financial variables contribute most strongly to estimated risk?
3. **RQ3**: Can crop-yield forecasting provide useful early indicators of agricultural financial risk?
4. **RQ4**: Does incorporating agricultural and climate variables improve risk prediction compared with a finance-only baseline?
5. **RQ5**: How does prediction uncertainty affect the resulting financial-risk estimate?
6. **RQ6**: Can scenario analysis estimate how adverse climate conditions may affect future agricultural risk?

## Hypotheses to Test

- **H1**: Climate variables have a statistically significant relationship with crop yield
- **H2**: Agricultural variables provide additional predictive information beyond financial variables
- **H3**: Combined model outperforms finance-only baseline
- **H4**: Increasing climate uncertainty increases yield prediction uncertainty
- **H5**: Higher predicted yield-loss probability is associated with increased credit risk

## Non-Goals

AgRiX must NOT become:
- A generic crop recommendation application
- A simple weather dashboard
- A generic loan calculator
- A chatbot
- A "predict crop using Random Forest" demo
- A fake banking system
- A medical-style black-box risk predictor
- A UI-only project with a meaningless ML model

The **statistical methodology must drive the application**.

## Target Audiences

1. **Researchers** - Reproducible experiments, statistical rigor, publication-ready outputs
2. **Agricultural Lenders** - Risk assessment with uncertainty quantification
3. **Policy Makers** - Scenario analysis for climate adaptation planning
4. **Farmers/Cooperatives** - Understanding climate-financial linkages

## Success Criteria

The system must be suitable for:
1. Local demonstration
2. Academic project evaluation
3. Research experimentation
4. Future publication (if experiments provide sufficient novelty)

## Key Differentiators

- **Uncertainty-aware**: Every prediction includes quantified uncertainty
- **Research-grade**: Reproducible, auditable, statistically sound
- **Integrated**: Jointly models agricultural, climate, and financial domains
- **Explainable**: Every risk score has traceable drivers
- **Scenario-capable**: Monte Carlo simulation of climate stress scenarios
- **Honest**: Clear distinction between proxy scores and actual default probabilities