'use client';

// Main dashboard orchestrator for clinical trial matching
// Purpose: Manages state between input and results screens

import { useState } from 'react';
import InputScreen from './InputScreen';
import ResultsScreen from './ResultsScreen';
import type { MatchResultData } from '@/types';

export const MainDashboard = () => {
  const [results, setResults] = useState<MatchResultData | null>(null);

  const handleMatch = async (notes: string) => {
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patientText: notes }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to match trials');
      }

      // Transform API response to match UI component expectations
      const transformedResults: MatchResultData = {
        summary: `${data.profile.age}yo ${data.profile.gender} | ${data.profile.conditions.join(', ')}`,
        patientProfile: {
          diagnosis: data.profile.conditions[0] || 'Unknown',
          stage: data.profile.stage || 'Unknown',
          mutations: Object.entries(data.profile.biomarkers).map(([key, value]) => `${key}: ${value}`),
          ecog: parseInt(data.profile.performanceStatus?.replace('ECOG ', '') || '0'),
        },
        trials: data.matches.map((match: any) => ({
          id: match.trial.nctId,
          nctId: match.trial.nctId,
          name: match.trial.title,
          officialTitle: match.trial.briefSummary,
          phase: match.trial.phase,
          sponsor: 'Clinical Research Sponsor',
          status: match.trial.matchType === 'perfect' ? 'match' : match.trial.matchType === 'excluded' ? 'exclude' : 'uncertain',
          matchScore: match.result.matchScore,
          explanation: match.result.explanation,
          inclusionCriteria: match.result.inclusionMatches,
          exclusionCriteria: match.trial.exclusionCriteria,
          failedCriteria: match.result.exclusionFlags,
          clinicalTrialsGovLink: `https://clinicaltrials.gov/study/${match.trial.nctId}`,
        })),
      };

      setResults(transformedResults);
    } catch (error) {
      console.error('Match error:', error);
      alert('Failed to match trials. Please try again.');
    }
  };

  const handleBack = () => {
    setResults(null);
  };

  if (results) {
    return <ResultsScreen results={results} onBack={handleBack} />;
  }

  return <InputScreen onMatch={handleMatch} />;
};
