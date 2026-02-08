'use client';

// Main dashboard orchestrator for clinical trial matching
// Purpose: Manages state between input and results screens

import { useState } from 'react';
import InputScreen from './InputScreen';
import ResultsScreen from './ResultsScreen';
import { addConsultation } from '@/utils/consultationHistory';
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

      const deriveStatus = (result: any): 'match' | 'uncertain' | 'exclude' => {
        // Check for hard exclusion flags (mismatch, not unknown)
        const hasHardExclusion = Array.isArray(result.exclusionFlags) && 
          result.exclusionFlags.some((flag: string) => 
            flag.toLowerCase().includes('mismatch') || 
            flag.toLowerCase().includes('hard exclusion') ||
            flag.toLowerCase().includes('excludes')
          );
        
        if (hasHardExclusion) {
          return 'exclude';
        }
        
        // Use match score for status
        if (result.matchScore >= 70) return 'match';
        if (result.matchScore >= 40) return 'uncertain';
        return 'exclude';
      };

      // Transform API response to match UI component expectations
      const transformedResults: MatchResultData = {
        summary: `${data.profile.age}yo ${data.profile.gender} | ${data.profile.conditions.join(', ')}`,
        patientProfile: {
          diagnosis: data.profile.conditions[0] || 'Unknown',
          stage: data.profile.stage || 'Unknown',
          mutations: Object.entries(data.profile.biomarkers).map(([key, value]) => `${key}: ${value}`),
          ecog: parseInt(data.profile.performanceStatus?.replace('ECOG ', '') || '0'),
        },
        trials: data.matches.map((match: any) => {
          // Extract sponsor from trial title or use generic
          const getSponsor = (title: string): string => {
            if (title.includes('DESTINY')) return 'Daiichi Sankyo/AstraZeneca';
            if (title.includes('KATHERINE')) return 'Genentech/Roche';
            if (title.includes('MONARCH')) return 'Eli Lilly';
            if (title.includes('IMpassion')) return 'Genentech/Roche';
            if (title.includes('HER2CLIMB')) return 'Seagen';
            if (title.includes('NALA')) return 'Pierre Fabre';
            if (title.includes('SOPHIA')) return 'Daiichi Sankyo';
            return 'Clinical Research Consortium';
          };

          return {
            id: match.trial.nctId,
            nctId: match.trial.nctId,
            name: match.trial.title,
            officialTitle: match.trial.briefSummary,
            phase: match.trial.phase,
            sponsor: getSponsor(match.trial.title),
            status: deriveStatus(match.result),
            matchScore: match.result.matchScore,
            explanation: match.result.explanation,
            inclusionCriteria: match.result.inclusionMatches,
            exclusionCriteria: match.trial.exclusionCriteria,
            failedCriteria: match.result.exclusionFlags,
            clinicalTrialsGovLink: `https://clinicaltrials.gov/study/${match.trial.nctId}`,
          };
        }),
      };

      setResults(transformedResults);
      
      // Save to consultation history with original notes
      const diagnosis = data.profile.conditions[0] || 'Unknown condition';
      const highestScore = Math.max(...data.matches.map((m: any) => m.result.matchScore));
      const matchType = highestScore >= 70 ? 'High' : highestScore >= 40 ? 'Med' : 'None';
      const summary = `${data.profile.age}yo ${data.profile.gender}, ${data.profile.stage || 'Unknown stage'}`;
      
      addConsultation(diagnosis, matchType, summary, notes);
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
