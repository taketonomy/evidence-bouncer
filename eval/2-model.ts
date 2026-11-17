// ─────────────────────────────────────────────
// PART 2: The model
//
// One function. Takes a prompt, returns a string.
// The harness doesn't care what's inside —
// swap the model string to test a different one.
// ─────────────────────────────────────────────

import { client } from "../shared/model.js";

export async function callModel(
  model: string,
  prompt: string
): Promise<string> {
  const response = await client.chat.completions.create({
    model,
    max_tokens: 64,
    messages: [
      {
        role: "system",
        content:
          "Answer as briefly as possible. One word or number if you can. No punctuation.",
      },
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0].message.content?.trim() ?? "";
}
