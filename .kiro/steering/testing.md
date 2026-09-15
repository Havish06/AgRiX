# AgRiX Testing Steering

## Testing Principles

Testing is a release gate, not an optional activity.

- Test behavior and mathematical invariants, not implementation details
- Keep tests deterministic with explicit random seeds
- Separate unit, integration, property-based, API, E2E, regression, data validation, and leakage tests
- Run the full suite in CI before merge
- Never suppress a failing test without an approved, documented exception
- Never treat a green test suite as proof that the data or methodology is correct

## Test Levels

### 1. Unit Tests

Test the smallest independently testable units:

- Data validation rules
- Unit normalization
- Missing-value handling
- Feature engineering
- Statistical calculations
- Distribution fitting
- Correlation and hypothesis tests
- Regression coefficients and predictions
- Forecasting lag generation
- Prediction intervals
- Risk aggregation
- Expected loss
- Scenario simulation
- Model-card generation
- Serialization and schema conversion

Every important mathematical operation must have a automated test.

### 2. Integration Tests

Test component boundaries:

- API → service → model → response
- Data provider → validation → preprocessing → feature store
- Model registry → artifact load → prediction
- Scenario engine → risk engine → persistence
- Database migrations → repository queries
- Background job submission → progress → result

Use temporary databases and fixtures. Do not depend on live external APIs.

### 3. Property-Based Tests

Use Hypothesis for invariants that must hold over many generated inputs:

- Risk scores remain in `[0, 1]`
- Probabilities remain in `[0, 1]`
- Prediction interval lower bound never exceeds upper bound
- Yield predictions never become negative after domain constraints
- Empty or invalid inputs fail with meaningful errors
- Chronological splits preserve time order
- Duplicate rows are detected deterministically
- Identical inputs produce identical outputs for deterministic models

Property tests must be bounded and deterministic where practical.

### 4. API Tests

Test every endpoint with:

- Valid requests and responses
- Validation errors
- Invalid requests and error responses
- Status codes
- Error responses
- Response schemas
- Request validation
- Invalid requests and boundary cases
- Meaningful messages
- Timeout behavior
- Authentication/authorization where applicable
- CORS behavior
- Rate limiting where configured

Use `TestClient` or an equivalent async test client. Mock external dependencies.

### 5. End-to-End Tests

Cover the primary user journeys:

1. Open landing page → enter application
2. Select region, crop, period, and model
3. View statistical summary, distribution, correlation, and regression
4. Request a yield prediction and see uncertainty
5. Select a scenario and view scenario outputs
6. Compare models in Model Lab
7. Open Research page and inspect methodology metadata
8. Handle an unavailable API without freezing the UI

Run with Playwright against a real local frontend and backend.

### 6. Regression Tests

Pin known-good behavior for:

- Statistical formulas
- Risk thresholds
- Scenario outputs for fixture data
- API response schemas
- UI rendering of critical controls
- Model artifact loading

Regression tests must use checked-in, synthetic fixture data only. Never commit raw private datasets.

### 7. Data Validation Tests

For each dataset provider and ingestion path, verify:

- Rows received, rejected, corrected, and retained
- Missing-value counts
- Duplicate detection
- Impossible-value detection
- Unit consistency
- Temporal alignment
- Geographical alignment
- Target-leakage checks
- Safe failure on malformed input

### 8. Leakage Tests

Run a dedicated audit before final results:

- Future weather variables cannot enter training features
- Future crop yield cannot enter training features
- Future financial information cannot enter training features
- Target-derived and post-outcome variables are excluded
- No duplicate records cross train/test boundaries
- Preprocessing is fitted on training data only
- Chronological splits are enforced for forecasting

---

## Critical Logic Test Matrix

| Test | Expected behavior |
|---|---|
| Missing rainfall | Validation error or documented imputation |
| Negative yield | Rejected |
| Future information in training | Test failure |
| Probability `> 1` | Test failure |
| Probability `< 0` | Test failure |
| Lower uncertainty bound above upper bound | Test failure |
| Empty dataset | Meaningful error |
| Unknown crop | Validation error |
| Unknown region | Validation error |
| Model unavailable | Graceful fallback or explicit error |
| API timeout | UI remains responsive and displays error state |
| Malformed dataset | Ingestion fails safely |

---

## Test Data Policy

- Use synthetic fixtures for unit and integration tests
- Use representative, non-sensitive samples for E2E tests
- Never commit raw private datasets
- Store large public snapshots outside Git with a checksum and provenance manifest
- Document every fixture generation parameters and seed
- Keep fixture schemas stable across test runs
- Do not use production data in tests

---

## Python Test Commands

```bash
cd backend
python -m pytest
python -m pytest tests/unit
python -m pytest tests/integration
python -m pytest tests/property
python -m pytest tests/leakage
python -m pytest --cov=app --cov-report=term-missing
ruff check app tests
ruff format --check app tests
mypy app tests
```

## Frontend Test Commands

```bash
cd frontend
npm run lint
npm run typecheck
npm test -- --run
npm run test:e2e
```

## CI Quality Gates

A pull request must pass:

- [ ] Python lint
- [ ] Python format check
- [ ] Python type check
- [ ] Python unit tests
- [ ] Python integration tests
- [ ] Property-based tests
- [ ] API tests
- [ ] Data validation tests
- [ ] Leakage tests
- [ ] Frontend lint
- [ ] Frontend type check
- [ ] Frontend unit tests
- [ ] Playwright E2E tests
- [ ] Build succeeds from a clean environment

## Test Naming

Use descriptive names that state the invariant or behavior:

```python
def test_risk_score_remains_between_zero_and_one_for_valid_inputs():
    ...

def test_prediction_interval_lower_bound_never_exceeds_upper_bound():
    ...

def test_missing_rainfall_raises_validation_error_unless_imputation_is_configured():
    ...
```

For frontend tests:

```typescript
it('keeps the page responsive when the prediction API times out', async () => {
  ...
});
```

## Test Reporting

Test reports must include:

- Test count by level
- Coverage summary
- Failed test names
- Dataset/model versions used
- Random seed
- Environment details
- Duration
- Leakage-audit result

## Release Gate

No feature is complete until:

- Implementation is complete
- Unit tests pass
- Integration tests pass
- UI/error states are tested
- No TypeScript errors
- No lint errors
- No console errors
- Documentation is updated
- For ML: data validated, leakage checked, baseline established, uncertainty measured, and experiment logged
