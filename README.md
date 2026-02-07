
# MatchEngine Oncology

## Overview
This project is a prototype for Hackathon 01, an AI-powered web app that helps clinicians quickly match patients to clinical trials using free-text profiles. Built using AI coding agents (Kiro), it demonstrates AI nativeness through NLP for input parsing and explainable matching. The app is web-based and uses Next.js 14 with the Vercel AI SDK.

## Problem Statement
Clinical trial matching is slow, opaque, and inefficient:
- Patients miss opportunities due to lack of awareness and complex criteria.
- Clinicians lack tools to scan trials during consultations, relying on manual reviews.
- Trials face 80% enrollment delays, costing billions in recruitment.

Focused problem: Enable clinicians to input real-world patient profiles (messy free-text) and get transparent, explainable trial fits to discuss with patients. This targets the clinician bottleneck, where providers influence most enrollments but waste time on jargon-heavy criteria.

## Existing Solutions
- **Tempus**: AI pre-screening from EMRs, oncology-focused; provider-oriented but not ad-hoc for free-text.
- **BEKhealth**: Matches from EMRs, identifies 10x more patients; strong for sites but privacy-heavy and not clinician-conversation ready.
- **TrialX**: NLP matching for patients; form-based, lacks explainability for clinicians.
- **Antidote.me**: Questionnaire-driven; patient-facing, static, no messy text handling.
- **Inspirata Trial Navigator**: Automates with NLP/EHR; efficient but not transparent or clinician-centric.

Gaps: Most are form/EMR-based, lack explainable AI for free-text, and don't empower clinicians for real-time use.

## Our Solution
### Primary User
Clinicians (e.g., oncologists) during patient consultations.

### Specific Problem Solved
Clinicians input free-text patient profiles; AI provides instant trial matches with explanations, speeding up referrals and reducing opacity.

### Key Features
- **Free-Text Input**: Parse messy clinical notes into structured patient profiles
- **Document Upload with OCR**: Upload scanned medical documents (images, PDFs) and automatically extract text using Tesseract.js
- **Multi-Model AI Pipeline**: Specialized medical models with intelligent fallbacks
  - **Clinical-BERT** (Hugging Face): Medical entity extraction from clinical notes
  - **MedAlpaca** (Hugging Face): Clinical trial eligibility assessment
  - **Flan-T5** (Hugging Face): Mock trial generation
  - **OpenAI GPT-4o-mini**: Fallback for all tasks if Hugging Face unavailable
- **Ranked Results**: Trials sorted by match score (0-100) with color coding
- **Explainable Outputs**: Plain-English explanations for every match/exclusion
- **Demo Scope**: Focused on breast cancer with synthetic trials for reliability

### Why Our Solution is Great and Differentiated
- **Novelty**: Explainable AI for free-text—beyond black-box tools; clinician-focused for systemic impact.
- **Problem Research**: Addresses 80% delay stat by targeting referrals; gaps in clinician tools per industry reports.
- **UX & Empathy**: Intuitive interface understands clinician workflows (e.g., "Scan in 30s").
- **Technical Execution**: Meaningful AI/ML; uses mock data for demo reliability.
- **Communication**: Justified scope (oncology/US) for high-volume impact.

### Success Looks Like
- Quick matches (<30s) with 80%+ accuracy on mocks.
- Demo: End-to-end flow for a synthetic patient.

### Future Features (Post-Hackathon)
- EHR integration (e.g., Epic) for auto-input.
- Real-time trial alerts via PubMed.
- Sponsor dashboard for recruitment analytics.
- Patient self-service mode.
- Advanced ML: Train on enrollment data for predictive matching.

## System Architecture
```mermaid
graph TD
    A[Clinician User] -->|Paste Notes or Upload Document| B[Next.js Frontend Dashboard]
    B -->|OCR with Tesseract.js| B
    B -->|POST /api/match| C[Next.js API Route]
    C -->|1. Extract Patient Data| D{Hugging Face Available?}
    D -->|Yes| E[Clinical-BERT]
    D -->|No| F[OpenAI GPT-4o-mini]
    E -->|Fallback on Error| F
    F -->|Patient Profile| C
    C -->|2. Generate Mock Trials| G{Hugging Face Available?}
    G -->|Yes| H[Flan-T5]
    G -->|No| F
    H -->|Fallback on Error| F
    F -->|3 Mock Trials| C
    C -->|3. Assess Trial Fit x3| I{Hugging Face Available?}
    I -->|Yes| J[MedAlpaca]
    I -->|No| F
    J -->|Fallback on Error| F
    F -->|Match Results| C
    C -->|Validation Layer| K[Validate & Sanitize]
    K -->|Ranked Matches with Explanations| B
    B -->|Display Results with Model Attribution| A
```

**Key Components:**
- **Multi-Model Pipeline**: Tries specialized medical models (Clinical-BERT, MedAlpaca, Flan-T5) first, falls back to OpenAI
- **OCR Integration**: Tesseract.js for document upload and text extraction
- **Validation Layer**: Catches AI errors before displaying results (age, stage, biomarkers, trial format)
- **Model Attribution**: UI footer shows which models were used for transparency


## AI Validation & Safety

To ensure reliable outputs, we validate all AI-generated data before displaying results to clinicians:

### Patient Profile Validation
- **Age**: Must be 18-120 years (flags unrealistic values)
- **Cancer Stage**: Must be I, II, III, or IV (with sub-stages like IIIA, IVB)
- **ECOG Score**: Must be 0-5 (performance status validation)
- **Biomarker Contradictions**: Catches impossible combinations (e.g., TNBC cannot be HER2+, ER+, or PR+)
- **Missing Critical Data**: Warns when stage or biomarkers are absent for cancer patients

### Mock Trial Validation
- **Trial Count**: Always returns exactly 3 trials (perfect match, excluded, uncertain)
- **NCT ID Format**: Validates NCT + 8 digits format
- **Required Fields**: Ensures title, phase, summary, and criteria are present
- **Match Score Range**: Validates 0-100 score and alignment with matchType
- **Criteria Completeness**: Requires minimum 3 inclusion and 2 exclusion criteria

### Edge Cases Handled
- **Format Issues**: Normalizes stage format ("stage III" → "Stage III"), ECOG notation
- **Impossible Combinations**: Flags Stage 0 metastatic disease, contradictory biomarkers
- **Missing Data**: Provides warnings when critical fields are absent
- **Out-of-Range Values**: Clamps ages, scores to valid ranges
- **Malformed AI Output**: Falls back to hardcoded demo trials if validation fails

### Current Limitations
- **Mock Data Only**: No real ClinicalTrials.gov API integration (demo reliability)
- **Breast Cancer Focus**: Optimized for HER2+/ER+/PR+ biomarkers only
- **US Trials Only**: No international trial support
- **No EHR Integration**: Manual free-text input required
- **Single Disease**: Not validated for non-oncology conditions
- **Conservative Scoring**: May under-match to prioritize patient safety

### Future Improvements
- Real-time trial database sync with ClinicalTrials.gov API
- Multi-disease support with disease-specific validation rules
- EHR integration for automatic patient data extraction
- Machine learning model trained on actual enrollment outcomes
- Clinician feedback loop to improve match accuracy
- Support for rare biomarkers and complex eligibility criteria

## Current Status

✅ **Complete:**
- AI prompt engineering (extract, generate, assess)
- API route (`/api/match`) with full matching pipeline
- Type definitions and error handling
- Mock trial data for demo scenarios
- AI design documentation
- Validation layer for AI outputs (patient profiles, mock trials)
- Polished UI components (InputScreen, ResultsScreen, MainDashboard)

🚧 **In Progress:**
- End-to-end integration testing with OpenAI API
- Deployment to Vercel

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and add your API keys:
```bash
cp .env.example .env
```

Edit `.env` and add:
- `OPENAI_API_KEY`: Required for fallback AI processing
- `HUGGINGFACE_API_KEY`: Optional, enables specialized medical models (Clinical-BERT, MedAlpaca, Flan-T5)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Multi-Model AI Pipeline

The app uses a sophisticated multi-model approach with intelligent fallbacks:

### Model Selection Strategy
1. **Primary**: Hugging Face medical models (if API key provided)
   - Clinical-BERT for extraction
   - MedAlpaca for assessment
   - Flan-T5 for generation
2. **Fallback**: OpenAI GPT-4o-mini (always available)

### Why Multiple Models?
- **Domain Expertise**: Medical models are fine-tuned on clinical data
- **Cost Efficiency**: Hugging Face Inference API is often more cost-effective
- **Reliability**: OpenAI fallback ensures the app always works
- **Transparency**: Console logs show which model was used for each task

### Model Attribution
The UI footer displays: "Powered by Clinical-BERT, MedAlpaca & Flan-T5" to acknowledge the medical AI models used.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode, no 'any')
- **Styling**: Tailwind CSS
- **AI Integration**: 
  - Hugging Face Inference API (@huggingface/inference)
    - Clinical-BERT for medical entity extraction
    - MedAlpaca for clinical assessment
    - Flan-T5 for trial generation
  - Vercel AI SDK with OpenAI GPT-4o-mini (fallback)
- **OCR**: Tesseract.js (browser-based document scanning)
- **Icons**: Lucide React
- **Code Generation**: 100% AI-generated via Kiro
- **Deployment**: Vercel (planned)
- **Code Style**: Airbnb ESLint config

## Project Structure

```
src/
├── app/
│   ├── api/match/    # API route for trial matching
│   ├── page.tsx      # Main dashboard page
│   ├── layout.tsx    # Root layout
│   └── globals.css   # Global styles
├── components/       # UI components
│   ├── InputScreen.tsx      # Free-text input interface with OCR
│   ├── ResultsScreen.tsx    # Trial results display
│   └── MainDashboard.tsx    # State orchestrator
├── ai/
│   ├── execute.ts         # AI execution layer with multi-model support
│   ├── medicalModels.ts   # Hugging Face medical model integrations
│   ├── validation.ts      # AI output validation and sanitization
│   └── prompts/           # AI prompt templates for LLM calls
│       ├── extractPatientProfile.ts  # Parse free-text to structured data
│       ├── assessTrialFit.ts         # Evaluate patient-trial matches
│       └── generateMockTrials.ts     # Generate demo trials
├── types/            # TypeScript interfaces and types
└── ...
docs/
├── ai-design.md          # AI usage, limitations, and safety guidelines
└── validation-guide.md   # Validation architecture documentation
.kiro/
└── steering/             # Project rules and constraints
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
