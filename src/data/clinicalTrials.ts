// Real clinical trials data from ClinicalTrials.gov
// Purpose: Load trials from JSON and filter by cancer type
// Data source: https://clinicaltrials.gov/

import type { MockTrial, PatientProfile } from '@/types';
import trialsData from './clinical-trials.json';

/**
 * All clinical trials loaded from JSON
 */
const ALL_TRIALS: MockTrial[] = trialsData.trials as MockTrial[];

/**
 * Helper function to extract biomarker status (positive/negative/unknown)
 */
const extractBiomarkerStatus = (biomarkers: Record<string, string>, marker: string): 'positive' | 'negative' | 'unknown' => {
  const markerKey = Object.keys(biomarkers).find(k => k.toLowerCase().includes(marker.toLowerCase()));
  if (!markerKey) return 'unknown';
  
  const value = biomarkers[markerKey].toLowerCase();
  if (value.includes('positive') || value.includes('+') || value === '3+' || value === '2+') {
    return 'positive';
  }
  if (value.includes('negative') || value.includes('-') || value === '0' || value === '1+') {
    return 'negative';
  }
  return 'unknown';
};

/**
 * Detect cancer type from patient profile
 * @param patient - Patient profile with conditions
 * @returns Cancer type string
 */
const detectCancerType = (patient: PatientProfile): 'breast' | 'lung' | 'colorectal' | 'prostate' | 'other' => {
  const conditions = patient.conditions.map(c => c.toLowerCase()).join(' ');
  
  if (conditions.includes('breast')) return 'breast';
  if (conditions.includes('lung') || conditions.includes('nsclc') || conditions.includes('sclc')) return 'lung';
  if (conditions.includes('colorectal') || conditions.includes('colon') || conditions.includes('rectal')) return 'colorectal';
  if (conditions.includes('prostate')) return 'prostate';
  
  return 'other';
};

/**
 * Get trials filtered by cancer type
 * @param cancerType - Type of cancer to filter by
 * @returns Array of trials matching the cancer type
 */
export const getTrialsByCancerType = (cancerType: 'breast' | 'lung' | 'colorectal' | 'prostate' | 'other'): MockTrial[] => {
  return ALL_TRIALS.filter(trial => trial.cancerType === cancerType);
};

/**
 * Get trials for a specific patient based on their cancer type and biomarkers
 * Pre-filters by HER2 status to avoid irrelevant matches
 * @param patient - Patient profile
 * @returns Array of relevant trials (up to 8 trials, shuffled for variety)
 */
export const getTrialsForPatient = (patient: PatientProfile): MockTrial[] => {
  const cancerType = detectCancerType(patient);
  let relevantTrials = getTrialsByCancerType(cancerType);
  
  console.log(`Detected cancer type: ${cancerType}`);
  console.log(`Found ${relevantTrials.length} ${cancerType} cancer trials`);
  
  // Fallback: if no trials found for detected type, use all trials
  if (relevantTrials.length === 0) {
    console.warn(`No trials found for ${cancerType}, falling back to all trials`);
    relevantTrials = [...ALL_TRIALS];
  }
  
  // PRE-FILTER: Filter by HER2 status to reduce irrelevant matches
  const biomarkers = patient.biomarkers || {};
  const her2Status = extractBiomarkerStatus(biomarkers, 'HER2');
  
  if (her2Status === 'positive') {
    // Patient is HER2+, only keep HER2+ trials
    const her2PositiveTrials = relevantTrials.filter(trial => {
      const trialText = `${trial.title} ${trial.briefSummary} ${trial.inclusionCriteria.join(' ')}`.toLowerCase();
      return trialText.includes('her2+') || 
             trialText.includes('her2-positive') || 
             trialText.includes('her2 positive');
    });
    
    if (her2PositiveTrials.length > 0) {
      relevantTrials = her2PositiveTrials;
      console.log(`Pre-filtered to ${relevantTrials.length} HER2+ trials`);
    } else {
      console.warn('No HER2+ trials found, keeping all trials');
    }
  } else if (her2Status === 'negative') {
    // Patient is HER2-, only keep HER2- or TNBC trials
    const her2NegativeTrials = relevantTrials.filter(trial => {
      const trialText = `${trial.title} ${trial.briefSummary} ${trial.inclusionCriteria.join(' ')}`.toLowerCase();
      return trialText.includes('her2-') || 
             trialText.includes('her2-negative') || 
             trialText.includes('her2 negative') ||
             trialText.includes('triple negative') ||
             trialText.includes('tnbc') ||
             trialText.includes('her2-low');
    });
    
    if (her2NegativeTrials.length > 0) {
      relevantTrials = her2NegativeTrials;
      console.log(`Pre-filtered to ${relevantTrials.length} HER2- trials`);
    } else {
      console.warn('No HER2- trials found, keeping all trials');
    }
  } else {
    // HER2 status unknown, keep all trials
    console.log('HER2 status unknown, keeping all trials for assessment');
  }
  
  // Shuffle trials for variety (different subset each time)
  const shuffled = [...relevantTrials].sort(() => Math.random() - 0.5);
  
  // Return up to 8 trials for assessment
  return shuffled.slice(0, Math.min(8, shuffled.length));
};

/**
 * Get a random selection of trials (for demo/testing)
 * @param count - Number of trials to return
 * @returns Array of random trials
 */
export const getRandomTrials = (count: number = 8): MockTrial[] => {
  const shuffled = [...ALL_TRIALS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Get all available trials
 * @returns Array of all trials
 */
export const getAllTrials = (): MockTrial[] => {
  return ALL_TRIALS;
};

/**
 * Get trial statistics
 * @returns Object with trial counts by cancer type
 */
export const getTrialStats = (): Record<string, number> => {
  const stats: Record<string, number> = {
    total: ALL_TRIALS.length,
    breast: 0,
    lung: 0,
    colorectal: 0,
    prostate: 0,
    other: 0,
  };
  
  ALL_TRIALS.forEach(trial => {
    stats[trial.cancerType]++;
  });
  
  return stats;
};
