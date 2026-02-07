# AI Design Document

## Overview

This document explains how AI is used in the Clinical Trial Patient Match Co-Pilot, what it can and cannot do, and how clinicians should interpret its results.

## What the AI Does

The AI in this system is responsible for:

- **Parsing free-text patient information** into structured data (conditions, medications, demographics)
- **Matching patient profiles** against clinical trial eligibility criteria from ClinicalTrials.gov
- **Ranking potential trial matches** based on relevance and fit
- **Highlighting key eligibility factors** that make a trial a good or poor match
- **Suggesting questions** clinicians might ask patients to clarify eligibility

Think of it as a research assistant that does the initial legwork of finding relevant trials and explaining why they might fit.

## What the AI Does NOT Do

The AI explicitly does not:

- **Make final eligibility decisions** - only clinicians can determine if a patient qualifies
- **Replace clinical judgment** - it's a tool to augment, not replace, your expertise
- **Access real patient data** - this prototype uses mock data only
- **Guarantee accuracy** - all suggestions must be verified against official trial protocols
- **Handle regulatory compliance** - IRB approval, consent, and enrollment are outside its scope
- **Provide medical advice** - it matches criteria, it doesn't recommend treatments

## Prototype Assumptions (24-Hour Build)

This is a rapid prototype with intentional shortcuts:

- **Limited data sources**: Only pulling from ClinicalTrials.gov API, not proprietary trial databases
- **Simple matching logic**: Basic keyword and criteria matching, not sophisticated ML models
- **No validation pipeline**: Results aren't cross-checked against multiple sources
- **Mock patient data**: All examples are synthetic - no real PHI
- **No user authentication**: Security is minimal for demo purposes
- **Single-user design**: No multi-clinician workflows or data sharing
- **English-only**: No multilingual support for international trials

These are acceptable for a proof-of-concept but would need addressing for production use.

## Sources of Uncertainty

Clinical trial matching has inherent uncertainty:

### Data Quality Issues
- Trial listings may be outdated or incomplete on ClinicalTrials.gov
- Eligibility criteria are written in natural language with varying specificity
- Some trials don't list all inclusion/exclusion criteria publicly

### Parsing Challenges
- Free-text patient notes are ambiguous (e.g., "history of cancer" - when? what type?)
- Medical terminology varies (brand names vs. generic, abbreviations, synonyms)
- Context matters (e.g., "no diabetes" vs. "diabetes ruled out" vs. "pre-diabetic")

### Matching Complexity
- Some criteria are subjective (e.g., "good general health")
- Numeric thresholds may have gray areas (e.g., BMI 29.9 vs. 30.0)
- Interactions between criteria aren't always clear (e.g., age + comorbidity combinations)

### AI Model Limitations
- LLMs can hallucinate or misinterpret medical terms
- Ranking algorithms may miss nuanced eligibility factors
- Confidence scores are estimates, not guarantees

## How Clinicians Should Interpret Results

### Use the AI as a Starting Point
- Treat matches as "candidates to investigate," not "approved trials"
- Always verify eligibility criteria directly with the trial protocol
- Cross-reference with your own knowledge of the patient's full medical history

### Understand Confidence Scores
- High confidence (80%+): Strong keyword/criteria overlap, worth prioritizing
- Medium confidence (50-80%): Partial match, needs closer review
- Low confidence (<50%): Weak match, likely not suitable but included for completeness

These are heuristics, not statistical probabilities.

### Check the AI's Reasoning
- Review the "Why this trial?" explanations for each match
- Look for red flags (e.g., misinterpreted conditions, overlooked exclusions)
- If the reasoning seems off, trust your judgment over the AI

### Verify Critical Details
- Contact trial coordinators to confirm current enrollment status
- Check if the trial site is accessible for your patient
- Confirm the patient meets all unlisted criteria (e.g., insurance, transportation)

## Ethical and Safety Considerations

### No Eligibility Guarantees
This tool does not guarantee a patient is eligible for any trial. Final eligibility is determined by:
- The trial's principal investigator
- Screening procedures defined in the protocol
- Regulatory and institutional requirements

### Bias and Fairness
- AI models may reflect biases in training data (e.g., underrepresentation of certain demographics in trials)
- Be aware that trial availability itself is unequal across regions and populations
- Use clinical judgment to ensure equitable access to trial information

### Patient Autonomy
- Patients have the right to decline trial participation
- Present options neutrally, don't oversell based on AI rankings
- Ensure informed consent if pursuing a trial match

### Data Privacy
- This prototype uses mock data only - never input real patient information
- A production system would require HIPAA compliance, encryption, and audit logs
- Be transparent with patients about how their data is used

### Liability
- The AI is a decision-support tool, not a medical device
- Clinicians retain full responsibility for patient care decisions
- Document your reasoning if you override AI suggestions

## When to Escalate Beyond the AI

Stop relying on the AI and consult directly with trial teams if:
- The patient has complex, rare, or poorly documented conditions
- Eligibility criteria are ambiguous or contradictory
- The trial involves high-risk interventions
- You're unsure about the AI's interpretation

## Future Improvements

For a production system, we'd need:
- Integration with EHR systems for real patient data
- Validation against expert clinician reviews
- Explainability features (why did the AI rank trial X over Y?)
- Continuous monitoring for accuracy and bias
- Regulatory review (FDA, IRB) if used in clinical workflows

---

**Bottom line**: This AI is a research assistant, not a decision-maker. Use it to save time finding trials, but always apply your clinical expertise before acting on its suggestions.
