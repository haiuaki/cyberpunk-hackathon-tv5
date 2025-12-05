/**
 * Natural Language Search API
 * POST /api/search
 *
 * Accepts natural language queries and returns semantically matched content
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { semanticSearch, parseSearchQuery, explainRecommendation } from '@/lib/natural-language-search';

// Define the schema for the taste profile
const TasteProfileSchema = z.object({
  genres: z.array(z.string()).optional(),
  themes: z.array(z.string()).optional(),
  moods: z.array(z.string()).optional(),
}).optional();

// Request schema
const SearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  tasteProfile: TasteProfileSchema,
  explain: z.boolean().optional(), // Whether to include AI explanations
  limit: z.number().min(1).max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, tasteProfile, explain, limit = 20 } = SearchRequestSchema.parse(body);

    // Perform semantic search
    const results = await semanticSearch(query, tasteProfile);

    // Apply limit
    const limitedResults = results.slice(0, limit);

    // Add explanations if requested
    let finalResults = limitedResults;
    if (explain) {
      finalResults = await Promise.all(
        limitedResults.map(async (result) => ({
          ...result,
          explanation: await explainRecommendation(
            result.content,
            query,
            result.matchReasons
          ),
        }))
      );
    }

    // Parse query to return intent (for debugging/UI)
    const parsedQuery = await parseSearchQuery(query);

    return NextResponse.json({
      success: true,
      query: query,
      intent: parsedQuery.intent,
      results: finalResults,
      totalResults: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}

// GET endpoint now uses the POST logic for consistency
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json(
            { success: false, error: 'Query parameter "q" is required' },
            { status: 400 }
        );
    }
    
    // We can't get a taste profile from a GET request, so we pass null.
    const mockRequest = {
        json: async () => ({
            query: query,
            tasteProfile: null
        })
    } as NextRequest;
    
    // This is a workaround to reuse the POST logic. 
    // In a real app, you might consider refactoring the core logic out of the POST handler.
    const postResponse = await POST(mockRequest);
    const data = await postResponse.json();

    return NextResponse.json(data);
}
