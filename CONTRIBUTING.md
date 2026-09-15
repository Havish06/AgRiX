# Contributing to AgRiX

Thank you for your interest in contributing to AgRiX! This document outlines the guidelines and processes for contributing to this research-oriented project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Accept feedback gracefully
- Prioritize research integrity over speed

## Research Integrity Standards

**All contributors must adhere to these non-negotiable standards:**

1. **No Fabrication**: Never invent datasets, experimental results, metrics, statistical significance, model performance, or scientific claims
2. **Clear Distinction**: Always distinguish between proxy risk scores and actual default probabilities
3. **Temporal Integrity**: Prevent future information leakage in all forecasting tasks
4. **Reproducibility**: Every experiment must be fully reproducible with versioned data, features, models, and seeds
5. **Honest Reporting**: Report limitations, failed experiments, and negative results

## Development Workflow

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/AgRiX.git
cd AgRiX
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming convention:
- `feature/` - New features
- `fix/` - Bug fixes
- `research/` - Research experiments
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions

### 3. Set Up Development Environment

#### Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
pre-commit install
```

#### Frontend

```bash
cd frontend
npm install
```

### 4. Make Changes

Follow the coding standards in `.kiro/steering/coding-standards.md` and research methodology in `.kiro/steering/research-methodology.md`.

#### For Research Changes

- Update the experiment log in `docs/experiment-log.md`
- Document methodology changes in `docs/methodology.md`
- Add tests for new statistical functions
- Run leakage checks before committing

#### For Code Changes

- Write tests before declaring complex logic complete
- Keep domain logic independent from HTTP/framework code
- Use descriptive variable names
- Avoid magic numbers
- Document non-obvious mathematical assumptions

### 5. Run Quality Checks

```bash
# Backend
cd backend
ruff check .
ruff format .
mypy .
pytest

# Frontend
cd frontend
npm run lint
npm run typecheck
npm test
```

### 6. Commit

Use conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Refactoring
- `test`: Tests
- `chore`: Maintenance
- `research`: Research experiment

Example:
```
feat(statistics): add gamma distribution fitting with AIC comparison

- Implement GammaDistributionFitter class
- Add AIC/BIC model selection
- Include goodness-of-fit tests
- Add unit tests with property-based verification
```

### 7. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a Pull Request with:
- Clear title and description
- Reference to related issues
- Summary of changes
- Test results
- For research: experiment results and methodology notes

## Pull Request Requirements

All PRs must pass:

- [ ] All tests pass (unit, integration, property-based)
- [ ] No linting errors
- [ ] No type errors
- [ ] No console errors in frontend
- [ ] Documentation updated
- [ ] For ML changes: leakage audit passed
- [ ] For research: experiment logged

## Testing Guidelines

### Unit Tests

- Test every statistical function
- Test edge cases (empty data, single values, extreme values)
- Use property-based testing for mathematical invariants

```python
# Example property test
@given(st.lists(st.floats(min_value=0), min_size=2))
def test_variance_non_negative(values):
    assert variance(values) >= 0
```

### Integration Tests

- Test API endpoints end-to-end
- Test data pipeline flows
- Test model training → prediction flows

### Leakage Tests

- Verify no future data in training splits
- Check temporal ordering in time-series
- Validate no target-derived features

## Documentation Standards

- Update README for user-facing changes
- Update API docs for endpoint changes
- Update methodology docs for research changes
- Add docstrings to all public functions/classes
- Use type hints throughout

## Data and Model Guidelines

### Adding Datasets

1. Document source, license, access date in `data/metadata/`
2. Add validation schema
3. Create data provider implementation
4. Add to dataset registry

### Adding Models

1. Register in model registry with version
2. Document hyperparameters, training data, metrics
3. Create model card
4. Add to experiment tracking

## Review Process

1. Automated checks must pass
2. At least one maintainer review
3. For research changes: methodology review required
4. No merging with failing tests

## Release Process

Releases follow semantic versioning:
- MAJOR: Breaking API changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes

Research milestones are tagged separately: `research/v1.0`, `research/v2.0`

## Getting Help

- Check existing issues and discussions
- Read the steering files in `.kiro/steering/`
- Ask questions in GitHub Discussions
- For research questions, tag `@research-maintainers`

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md
- Release notes
- Research publications (for significant research contributions)

---

**Remember**: AgRiX is a research project first. Quality, correctness, and integrity take precedence over velocity.