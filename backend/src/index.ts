import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, "0.0.0.0", () => {
  console.log(`Commission Engine API running on port ${env.port}`);
});
