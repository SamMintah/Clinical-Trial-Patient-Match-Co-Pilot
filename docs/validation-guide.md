# AI Validation Guide

## Overview
This document describes the validation layer that ensures AI-generated outputs are safe and reliable for clinical use.

## Validation Architecture

```
AI Output → Sanitize → Validate → Log Errors/Warnings → Return to API
```

### 1. Patient Profile Validation (`validatePatientProfile`)

**Purpose**: Catch unrealistic values and medical contradictions in extracted patient data.

**Validations:**
- Age: 18-120 years (errors if outside range)
- Cancer Stage: Must match I, II, III, IV format (with sub-stages)
- ECOG Score: 0-5 range validation
- Biomarker Contradictions: TNBC cannot be HER2+/ER+/PR+
- Missing Critical Data: Warns if conditions, stage, or biomarkers absent

**Example Error:**
```
"Invalid cancer stage: 'Stage V'. Must be I, II, III, or IV"
```

**Example Warning:**
```
"No biomarkers (HER2, ER, PR) extracted - critical for breast cancer trial matching"
```

### 2. Mock Trial Validation (`validateMockTrials`)

**Purpose**: Ensure exactly 3 trials with complete, realistic data.

**Validations:**
- Trial Count: Must be exactly 3
- NCT ID Format: NCT + 8 digits (e.g., NCT04567890)
- Required Fields: Title, phase, summary, criteria present
- Match Score: 0-100 range, aligned with matchType
- Criteria Completeness: Min 3 inclusion, 2 exclusion criteria
- MatchType Distribution: Should have 1 perfect, 1 excluded, 1 uncertain

**Example Error:**
```
"Trial 2: Invalid NCT ID format 'NCT123'. Must be NCT + 8 digits"
```

**Example Warning:**
```
"Trial 1: 'perfect' match has low score (72). Expected 85+"
```

### 3. Sanitization Functions

**`sanitizePatientProfile`:**
- Clamps age to 0-120 range
- Normalizes stage format ("stage III" → "Stage III")
- Normalizes ECOG format ("1" → "ECOG 1")
- Standardizes biomarker keys (uppercase, no special chars)

**`sanitizeMockTrials`:**
- Ensures exactly 3 trials (slices array)
- Fixes malformed NCT IDs (generates random if invalid)
- Normalizes phase format ("Phase 1", "Phase 2", "Phase 3")
- Clamps match scores to 0-100
- Defaults invalid matchType to "uncertain"

## Integration Points

### In `src/ai/execute.ts`:

```typescript
// After AI extraction
const sanitized = sanitizePatientProfile(parsed);
const validation = validatePatientProfile(sanitized);

if (!validation.isValid) {
  console.error('Validation failed:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}

return sanitized;
```

### In API Route (`src/app/api/match/route.ts`):

Validation happens automatically in `extractPatient()` and `generateTrials()`. Errors/warnings are logged to console for debugging.

## Edge Cases Handled

| Edge Case | Handling |
|-----------|----------|
| Age > 120 | Clamp to 120, log error |
| Stage "III/IV" | Log error, pass through (clinician review) |
| Missing biomarkers | Log warning, continue matching |
| TNBC + HER2+ | Log error (contradiction) |
| 2 trials returned | Log error, use fallback trials |
| Invalid NCT ID | Generate random valid ID |
| Match score 150 | Clamp to 100 |
| matchType "maybe" | Default to "uncertain" |

## Testing Validation

### Test Invalid Patient:
```typescript
const invalidPatient = {
  age: 150,  // Too old
  stage: "Stage V",  // Invalid
  biomarkers: { HER2: "positive" },
  conditions: ["triple negative breast cancer"],  // Contradiction
};

const validation = validatePatientProfile(invalidPatient);
// validation.isValid === false
// validation.errors.length === 3
```

### Test Invalid Trials:
```typescript
const invalidTrials = [
  { nctId: "NCT123", matchScore: 150, ... },  // Bad ID, bad score
  { nctId: "NCT04567890", matchScore: 50, ... },
];

const validation = validateMockTrials(invalidTrials);
// validation.isValid === false (only 2 trials)
// validation.errors includes NCT ID and count errors
```

## Future Enhancements

1. **Disease-Specific Rules**: Validate biomarkers per cancer type
2. **Cross-Field Validation**: Check stage vs. metastatic status consistency
3. **Severity Levels**: Distinguish blocking errors from warnings
4. **Validation Metrics**: Track validation failure rates over time
5. **Auto-Correction**: Attempt to fix common AI mistakes automatically
6. **User Feedback**: Allow clinicians to report validation misses

## Debugging

Enable verbose validation logging:
```typescript
// In src/ai/execute.ts
console.log('Raw AI output:', response.text);
console.log('Parsed:', parsed);
console.log('Sanitized:', sanitized);
console.log('Validation:', validation);
```

Check browser console or server logs for validation errors/warnings during development.
