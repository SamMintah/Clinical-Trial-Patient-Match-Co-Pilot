// Next.js API route for clinical trial matching
// Purpose: Server-side endpoint that orchestrates patient extraction, trial generation, and matching

import { NextRequest, NextResponse } from 'next/server';
import { extractPatient, generateTrials, assessTrial } from '../../../ai/execute';

interface MatchRequest {
  patientText: string;
}

/**
 * POST handler for clinical trial matching
 * Accepts patient free-text, extracts profile, generates trials, and assesses matches
 */
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Parse request body
    const body = await request.json() as MatchRequest;
    const { patientText } = body;

    if (!patientText) {
      return NextResponse.json(
        { success: false, error: 'patientText is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    // Log patient input (truncated for privacy)
    console.log('Matching patient:', patientText.slice(0, 50));
    const startTime = Date.now();

    // Step 1: Extract structured patient profile from free-text
    console.log('Step 1: Extracting patient profile...');
    const profile = await extractPatient(patientText);
    console.log(`✓ Extraction complete in ${Date.now() - startTime}ms`);

    // Step 2: Load real trials filtered by patient's cancer type
    console.log('Step 2: Loading relevant trials...');
    const trialsStart = Date.now();
    const trials = await generateTrials(profile);
    console.log(`✓ Trials loaded in ${Date.now() - trialsStart}ms`);

    // Step 3: Assess all trials in parallel for speed
    console.log('Step 3: Assessing trial eligibility (parallel)...');
    const assessStart = Date.now();
    const assessmentPromises = trials.map(async (trial) => {
      const result = await assessTrial(profile, trial);
      
      return {
        trial,
        result,
        rank: 0, // Will be calculated after sorting
      };
    });

    const matches = await Promise.all(assessmentPromises);
    console.log(`✓ All assessments complete in ${Date.now() - assessStart}ms`);

    // Step 4: Sort matches by score (descending)
    matches.sort((a, b) => b.result.matchScore - a.result.matchScore);

    // Step 5: Assign ranks
    matches.forEach((match, index) => {
      match.rank = index + 1;
    });

    const totalTime = Date.now() - startTime;
    console.log(`✓ Total matching pipeline complete in ${totalTime}ms`);

    // Return successful response with CORS headers
    return NextResponse.json(
      {
        success: true,
        profile,
        matches,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Match API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
};

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = async (): Promise<NextResponse> => NextResponse.json(
  {},
  {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  }
);
