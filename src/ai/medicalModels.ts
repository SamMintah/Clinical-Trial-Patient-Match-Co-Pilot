// Medical AI models using Hugging Face Inference API
// Purpose: Specialized medical models for clinical trial matching

import { HfInference } from '@huggingface/inference';

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Model configurations for different tasks
export const MEDICAL_MODELS = {
  // Clinical-BERT: Fine-tuned on clinical notes for entity extraction
  extraction: {
    name: 'emilyalsentzer/Bio_ClinicalBERT',
    description: 'Clinical-BERT for medical entity extraction',
    task: 'feature-extraction',
  },
  // MedAlpaca: Medical instruction-following model for assessment
  assessment: {
    name: 'medalpaca/medalpaca-7b',
    description: 'MedAlpaca for clinical trial eligibility assessment',
    task: 'text-generation',
  },
  // Flan-T5: General-purpose model for trial generation
  generation: {
    name: 'google/flan-t5-large',
    description: 'Flan-T5 for mock trial generation',
    task: 'text2text-generation',
  },
} as const;

/**
 * Extract patient profile using Clinical-BERT
 * Falls back to OpenAI if Hugging Face fails
 */
export const extractWithClinicalBERT = async (
  patientText: string
): Promise<{ success: boolean; data?: unknown; error?: string; model: string }> => {
  try {
    // Clinical-BERT is primarily for embeddings/feature extraction
    // For structured extraction, we'll use text generation with medical context
    const prompt = `Extract structured patient information from clinical notes.

Clinical Notes: "${patientText}"

Extract and return JSON with these fields:
- age (number)
- gender (male/female/other/unknown)
- conditions (array of diagnoses)
- medications (array)
- biomarkers (object with key-value pairs like HER2: positive)
- stage (cancer stage if applicable)
- priorTreatments (array)
- performanceStatus (ECOG score if mentioned)

Return only valid JSON, no additional text.`;

    const response = await hf.textGeneration({
      model: MEDICAL_MODELS.assessment.name,
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.3,
        return_full_text: false,
      },
    });

    return {
      success: true,
      data: response.generated_text,
      model: MEDICAL_MODELS.assessment.name,
    };
  } catch (error) {
    console.error('Clinical-BERT extraction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      model: MEDICAL_MODELS.extraction.name,
    };
  }
};

/**
 * Assess trial fit using MedAlpaca
 * Falls back to OpenAI if Hugging Face fails
 */
export const assessWithMedAlpaca = async (
  patientProfile: string,
  trialCriteria: string
): Promise<{ success: boolean; data?: unknown; error?: string; model: string }> => {
  try {
    const prompt = `You are a clinical trial matching assistant. Assess patient eligibility for a clinical trial.

Patient Profile:
${patientProfile}

Trial Eligibility Criteria:
${trialCriteria}

Provide assessment as JSON with:
- matchScore (0-100)
- confidenceLevel (high/medium/low)
- inclusionMatches (array of met criteria)
- exclusionFlags (array of failed criteria)
- uncertainFactors (array of unclear criteria)
- explanation (plain-English summary)
- questionsToAsk (array of follow-up questions)

Return only valid JSON, no additional text.`;

    const response = await hf.textGeneration({
      model: MEDICAL_MODELS.assessment.name,
      inputs: prompt,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.3,
        return_full_text: false,
      },
    });

    return {
      success: true,
      data: response.generated_text,
      model: MEDICAL_MODELS.assessment.name,
    };
  } catch (error) {
    console.error('MedAlpaca assessment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      model: MEDICAL_MODELS.assessment.name,
    };
  }
};

/**
 * Generate mock trials using Flan-T5
 * Falls back to OpenAI if Hugging Face fails
 */
export const generateWithFlanT5 = async (
  patientContext: string
): Promise<{ success: boolean; data?: unknown; error?: string; model: string }> => {
  try {
    const prompt = `Generate 3 realistic breast cancer clinical trials for this patient context: ${patientContext}

Requirements:
1. One trial that is a perfect match (allows prior therapy)
2. One trial with hard exclusion (requires no prior therapy)
3. One uncertain trial (borderline eligibility)

Each trial must include:
- nctId (NCT + 8 digits)
- title
- phase (Phase 1/2/3)
- briefSummary
- inclusionCriteria (array)
- exclusionCriteria (array)
- matchType (perfect/excluded/uncertain)
- matchScore (0-100)

Return as JSON array of 3 trials only.`;

    const response = await hf.textGeneration({
      model: MEDICAL_MODELS.generation.name,
      inputs: prompt,
      parameters: {
        max_new_tokens: 1500,
        temperature: 0.7,
        return_full_text: false,
      },
    });

    return {
      success: true,
      data: response.generated_text,
      model: MEDICAL_MODELS.generation.name,
    };
  } catch (error) {
    console.error('Flan-T5 generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      model: MEDICAL_MODELS.generation.name,
    };
  }
};

/**
 * Check if Hugging Face API is available
 */
export const isHuggingFaceAvailable = (): boolean => {
  return !!process.env.HUGGINGFACE_API_KEY;
};

/**
 * Get model attribution text for UI display
 */
export const getModelAttribution = (modelUsed: 'extraction' | 'assessment' | 'generation'): string => {
  const model = MEDICAL_MODELS[modelUsed];
  return `Powered by ${model.name} (${model.description})`;
};
