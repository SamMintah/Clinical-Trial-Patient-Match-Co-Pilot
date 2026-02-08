// Consultation history management using localStorage
// Purpose: Track recent patient consultations for quick access

export interface ConsultationRecord {
  id: string;
  diagnosis: string;
  matchType: 'High' | 'Med' | 'None';
  timestamp: number;
  patientSummary: string;
  originalNotes?: string; // Optional for backward compatibility with legacy records
}

const STORAGE_KEY = 'matchengine_consultations';
const MAX_HISTORY = 10;

/**
 * Get all consultation history from localStorage
 */
export const getConsultationHistory = (): ConsultationRecord[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load consultation history:', error);
    return [];
  }
};

/**
 * Add a new consultation to history
 */
export const addConsultation = (
  diagnosis: string,
  matchType: 'High' | 'Med' | 'None',
  patientSummary: string,
  originalNotes: string
): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getConsultationHistory();
    const newRecord: ConsultationRecord = {
      id: Date.now().toString(),
      diagnosis,
      matchType,
      timestamp: Date.now(),
      patientSummary,
      originalNotes,
    };
    
    // Add to beginning, keep only MAX_HISTORY items
    const updated = [newRecord, ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save consultation:', error);
  }
};

/**
 * Format timestamp as relative time
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

/**
 * Clear all consultation history
 */
export const clearHistory = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};
