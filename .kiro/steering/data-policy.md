# AgRiX Data Policy Steering

## Data Principles

AgRiX is only as trustworthy as its data lineage.

Every dataset must be:

- Traceable to a named provider
- Licensed for the intended use
- Versioned and checksummed
- Documented with temporal and geographic coverage
- Validated before modeling
- Reproducibly transformed
- Stored without private or sensitive data in Git
- Clearly labeled when synthetic, cached, or unavailable

## Data Provider Abstraction

Do not hard-code one API throughout the application.

```python
class DataProvider(Protocol):
    """Contract for reproducible external data access."""

    def fetch(self, request: DataRequest) -> DataSnapshot:
        """Fetch a versioned snapshot for the requested scope."""
        ...

    def metadata(self) -> DatasetMetadata:
        """Return provider, license, coverage, and access information."""
        ...

    def cache_key(self, request: DataRequest) -> str:
        """Return a stable cache key for the request."""
        ...
```

Concrete provider families:

```text
DataProvider
├── AgriculturalDataProvider
│   ├── FAOSTATProvider
│   └── NationalStatisticsProvider
├── ClimateDataProvider
│   ├── NOAAProvider
│   ├── NASAPowerProvider
│   ├── ERA5Provider
│   └── GovernmentWeatherProvider
├── FinancialDataProvider
│   ├── PublicCreditProvider
│   ├── HouseholdFinanceProvider
│   └── SyntheticFinancialProvider
└── CommodityDataProvider
    ├── PublicMarketProvider
    └── EconomicIndicatorProvider
```

## Provider Requirements

Each provider must:

- Implement the common interface
- Accept explicit date, geography, crop, and variable scopes
- Return a versioned snapshot, not an untracked stream
- Record access time and provider metadata
- Cache successful responses
- Fail safely when a live service is unavailable
- Support local snapshots for offline-first development
- Never expose credentials in logs or responses

## Dataset Metadata

Every dataset version records:

```yaml
dataset_name: "..."
provider: "..."
url: "..."
license: "..."
access_date: "YYYY-MM-DD"
temporal_coverage: "YYYY to YYYY"
geographic_coverage: "..."
variables:
  - name: "..."
    unit: "..."
    description: "..."
    source_field: "..."
preprocessing:
  - "..."
version: "..."
checksum: "sha256:..."
rows_received: 0
rows_rejected: 0
rows_corrected: 0
rows_retained: 0
missing_values: {}
outliers: {}
```

## Data Pipeline

The required pipeline is:

```text
Raw Data
  ↓
Schema Validation
  ↓
Missing Value Analysis
  ↓
Duplicate Detection
  ↓
Unit Normalization
  ↓
Outlier Analysis
  ↓
Temporal Alignment
  ↓
Geographical Alignment
  ↓
Feature Engineering
  ↓
Dataset Versioning
  ↓
Model Dataset
```

Invalid values must not silently disappear.

Each stage emits structured counts and a provenance record:

- Rows received
- Rows rejected
- Rows corrected
- Rows retained
- Missing values
- Outliers
- Corrections applied
- Transformation version
- Input and output checksums

## Validation Rules

The system must detect and report:

- Missing values
- Duplicate rows
- Impossible values
- Inconsistent units
- Negative yields
- Negative rainfall
- Impossible temperatures
- Inconsistent dates
- Mismatched geographical identifiers
- Target leakage
- Invalid or unknown crops
- Invalid or unknown regions

Example domain rules:

```text
rainfall_mm >= 0
yield_tonnes_per_hectare >= 0
area_harvested_ha > 0
production_tonnes >= 0
temperature_c within a documented plausible range
date <= ingestion date for historical observations
```

## Missing Data Policy

- Never silently impute
- Report missingness by variable and time period
- Distinguish missing at random from structurally unavailable data
- Allow explicit, documented imputation strategies
- Fit imputers on training data only
- Preserve an indicator when imputation is used
- Reject a request when required data is missing and no documented fallback exists

## Units and Normalization

- Store canonical units in the model dataset
- Preserve original values and units in the raw snapshot
- Use explicit conversion factors with source documentation
- Reject ambiguous units
- Log every correction and conversion

## Temporal and Geographic Alignment

- Normalize dates to a documented frequency
- Align observations before feature engineering
- Use stable region identifiers and a region crosswalk
- Preserve source identifiers for traceability
- Do not join on an ambiguous label alone
- Record the alignment method and coverage loss

## Synthetic Data

Synthetic financial profiles may be used for controlled experimentation only when:

- The generation process is documented
- Random seeds are recorded
- Synthetic status is visible in the UI and reports
- Results are labeled as illustrative or controlled
- Synthetic data is never presented as observed real-world evidence

## Privacy and Security

- Do not commit raw private datasets
- Do not log sensitive user or farm data
- Keep API keys and database credentials in environment configuration
- Never expose private credentials to the frontend
- Use least-privilege database access
- Restrict CORS to approved origins
- Document any personally identifiable or sensitive fields
- Anonymize or aggregate data where possible

## Offline-First Development

Required fallback flow:

```text
Live Provider
  ↓
Cache
  ↓
Verified Local Snapshot
  ↓
Application
```

When live data is unavailable:

- Use the latest verified local snapshot
- Display `Using cached dataset: YYYY-MM-DD`
- Show the snapshot version and provider metadata
- Do not silently substitute an unverified dataset

## Dataset Versioning

- Raw snapshots are immutable
- Each transformation creates a new dataset version
- Dataset versions are identified by a stable ID and checksum
- Feature matrices and targets reference the source dataset version
- Experiments reference the exact dataset and feature versions
- Keep a manifest of all versions and their lineage

## Data Retention and Publication

Before publication:

- Verify every source license and citation
- Remove private or restricted data from the repository
- Publish only permitted snapshots or provide reproducible download instructions
- Include access dates and retrieval commands
- Document known gaps, corrections, and outliers
- Include a data availability statement

## Data Quality Gates

A dataset is eligible for modeling only when:

- [ ] Schema validates
- [ ] Missingness is documented
- [ ] Duplicates are resolved or explicitly retained
- [ ] Units are normalized
- [ ] Outliers are reviewed
- [ ] Temporal alignment is valid
- [ ] Geographic alignment is valid
- [ ] Target leakage audit passes
- [ ] Dataset version and checksum are recorded
- [ ] Provenance and license are recorded
