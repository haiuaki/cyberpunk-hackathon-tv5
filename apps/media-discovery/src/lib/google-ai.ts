/**
 * Initializes the Google Generative AI provider for the AI SDK.
 * This is the V2-compatible entry point.
 */
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// The AI SDK will automatically pick up the GEMINI_API_KEY from environment variables.
export const google = createGoogleGenerativeAI();
