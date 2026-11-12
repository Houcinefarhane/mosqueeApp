/**
 * Remet motdepasse1! sur tous les comptes créés par l’import AMP
 * (parents tel.*, adultes eleve.*) + met à jour un CSV d’identifiants.
 *
 *   npm run import:reset-provisional-passwords
 *   npm run import:reset-provisional-passwords -- data/import-output/inscriptions-credentials-....csv
 */

import { config } from "dotenv";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { resolveAmpMosquee } from "../lib/import/resolve-amp-mosquee";
import { IMPORT_PROVISIONAL_PASSWORD } from "../lib/import/provisional-password";

config();

const prisma = new PrismaClient();

async function main() {
  const mosquee = await resolveAmpMosquee(prisma);
  const hash = await bcrypt.hash(IMPORT_PROVISIONAL_PASSWORD, 12);

  const users = await prisma.user.findMany({
    where: {
      mosqueeId: mosquee.id,
      OR: [
        { role: "PARENT", email: { startsWith: "tel." } },
        { role: "ELEVE", email: { startsWith: "eleve." } },
      ],
    },
    select: { id: true, email: true },
  });

  if (users.length === 0) {
    console.log("Aucun compte import à mettre à jour.");
    return;
  }

  await prisma.user.updateMany({
    where: { id: { in: users.map((u) => u.id) } },
    data: { password: hash, mustChangePassword: true },
  });

  console.log(
    `✅ ${users.length} compte(s) AMP → mot de passe provisoire « ${IMPORT_PROVISIONAL_PASSWORD} » (mustChangePassword).`
  );

  const csvArg = process.argv[2];
  const defaultGlob = resolve(
    process.cwd(),
    "data/import-output/inscriptions-credentials-2026-10-19T09-19-18-664Z.csv"
  );
  const csvPath = csvArg
    ? resolve(process.cwd(), csvArg)
    : existsSync(defaultGlob)
      ? defaultGlob
      : null;

  if (!csvPath || !existsSync(csvPath)) {
    console.log("ℹ️  CSV identifiants non trouvé — base mise à jour uniquement.");
    return;
  }

  const lines = readFileSync(csvPath, "utf8").split(/\r?\n/);
  const out = lines.map((line, i) => {
    if (i === 0 || !line.trim()) return line;
    const cols = line.split(";");
    if (cols.length >= 5) cols[4] = IMPORT_PROVISIONAL_PASSWORD;
    return cols.join(";");
  });
  writeFileSync(csvPath, out.join("\n") + (out[out.length - 1] === "" ? "" : "\n"), "utf8");
  console.log(`📄 CSV mis à jour : ${csvPath}`);
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
