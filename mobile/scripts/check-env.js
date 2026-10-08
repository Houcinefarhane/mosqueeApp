const { config } = require("dotenv");
const { resolve } = require("path");

config({ path: resolve(__dirname, "../.env") });

const url = process.env.MADRASAPP_SERVER_URL?.trim();
if (!url || !/^https:\/\/.+/i.test(url)) {
  console.error(
    "❌ Définissez MADRASAPP_SERVER_URL dans mobile/.env (URL HTTPS Vercel)."
  );
  process.exit(1);
}
console.log("✓ MadrasApp mobile →", url);
