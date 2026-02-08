// Global type definitions

export interface Patient {
  id: string;
  name: string;
}

export interface ClinicalTrial {
  id: string;
  title: string;
}

export interface PatientProfile {
  age: number;
  gender: 'male' | 'female' | 'other' | 'unknown';
  conditions: string[];
  medications: string[];
  allergies: string[];
  biomarkers: Record<string, string>;
  stage: string | null;
  priorTreatments: string[];
  performanceStatus: string | null;
  labValues: Record<string, string>;
}

export interface TrialCriteria {
  inclusion: string[];
  exclusion: string[];
}

export interface MatchResult {
  matchScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  inclusionMatches: string[];
  exclusionFlags: string[];
  uncertainFactors: string[];
  explanation: string;
  questionsToAsk: string[];
}

export interface MockTrial {
  nctId: string;
  title: string;
  phase: 'Phase 1' | 'Phase 2' | 'Phase 3';
  briefSummary: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  cancerType: 'breast' | 'lung' | 'colorectal' | 'prostate' | 'other';
}

// Types for new UI components
export interface Trial {
  id: string;
  nctId: string;
  name: string;
  officialTitle: string;
  phase: string;
  sponsor: string;
  status: 'match' | 'uncertain' | 'exclude';
  matchScore: number;
  explanation: string;
  inclusionCriteria: string[];
  exclusionCriteria?: string[];
  failedCriteria?: string[];
  clinicalTrialsGovLink: string;
}

export interface PatientProfileData {
  diagnosis: string;
  stage: string;
  mutations: string[];
  ecog: number;
}

export interface MatchResultData {
  summary: string;
  patientProfile: PatientProfileData;
  trials: Trial[];
}
