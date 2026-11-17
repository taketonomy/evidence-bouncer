import { client, requireApiKey } from "../shared/model.js";

requireApiKey();
for await (const model of client.models.list()) console.log(model.id);
