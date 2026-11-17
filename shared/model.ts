import "dotenv/config";
import OpenAI from "openai";
import { HttpsProxyAgent } from "https-proxy-agent";

const proxy = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;

export const client = new OpenAI({
  baseURL: "https://api.aiand.com/v1",
  // Defer missing-key failure to run preflight so failed runs can be recorded.
  apiKey: process.env.AIAND_API_KEY || "missing",
  ...(proxy ? { httpAgent: new HttpsProxyAgent(proxy) } : {}),
  timeout: 60_000,
  maxRetries: 0,
});

export const configuredModel = () => {
  requireApiKey();
  if (!process.env.AIAND_MODEL) throw new Error("Set AIAND_MODEL to an exact ID from npm run models.");
  return process.env.AIAND_MODEL;
};

export function requireApiKey() {
  if (!process.env.AIAND_API_KEY?.trim()) throw new Error("AIAND_API_KEY is missing. Configure it locally without printing it.");
}
