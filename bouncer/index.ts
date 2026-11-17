import { runEvidence } from "./runner.js";

const folder = process.argv[2];
if (!folder) throw new Error("Usage: npm run bouncer -- packs/tonight");
const result = await runEvidence(folder);
console.log(`\n${result.report}\nArtifacts: ${result.directory}`);
if (result.run.execution_status !== "completed") process.exitCode = 1;
