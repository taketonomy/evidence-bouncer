import OpenAI from "openai";
import "dotenv/config";

// OpenRouter is OpenAI-compatible. We just swap the baseURL.
export const client = new OpenAI({
  baseURL: "https://api.aiand.com/v1",
  apiKey: process.env.AIAND_API_KEY,
});
