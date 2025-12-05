import { google } from '@/lib/google-ai';
import { generateObject } from 'ai';
import { z } from 'zod';
import {NextResponse} from "next/server";

// Define the schema for the taste profile
const TasteProfileSchema = z.object({
  genres: z.array(z.string()).describe('A list of likely preferred movie genres.'),
  themes: z.array(z.string()).describe('A list of common themes, concepts, or settings.'),
  moods: z.array(z.string()).describe('A list of moods or tones the user might enjoy.'),
});

export async function POST(req: Request) {
  try {
    const { movieTitles } = await req.json();

    if (!movieTitles || !Array.isArray(movieTitles) || movieTitles.length === 0) {
      return NextResponse.json({ error: 'Movie titles are required.' }, { status: 400 });
    }

    // Use Gemini to generate the taste profile
    const { object: tasteProfile } = await generateObject({
      model: google.chat('models/gemini-1.5-flash-latest'),
      schema: TasteProfileSchema,
      prompt: `A user has indicated they like the following movies: ${movieTitles.join(', ')}. 
      Based on this selection, analyze the movies and generate a concise taste profile for the user. 
      Focus on the most prominent and shared characteristics of the selected movies.`,
    });

    return NextResponse.json(tasteProfile);

  } catch (error) {
    console.error('Failed to generate taste profile:', error);
    return NextResponse.json({ error: 'Failed to generate taste profile.' }, { status: 500 });
  }
}
