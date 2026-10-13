import { PrismaClient } from "@prisma/client";

const AMP_MOSQUEE_NOM = "AMP — Mosquée de Plaisir";
const EXCLUDED_MOSQUEE = [/démo/i, /demo/i, /test-charge/i, /mosquée de charge/i, /école démo/i];

export async function resolveAmpMosquee(prisma: PrismaClient) {
  const envId = process.env.AMP_MOSQUEE_ID?.trim();
  if (envId) {
    const mosquee = await prisma.mosquee.findUnique({ where: { id: envId } });
    if (!mosquee) throw new Error(`AMP_MOSQUEE_ID inconnu : ${envId}`);
    if (EXCLUDED_MOSQUEE.some((r) => r.test(mosquee.nom))) {
      throw new Error(`AMP_MOSQUEE_ID pointe vers une mosquée exclue : ${mosquee.nom}`);
    }
    return mosquee;
  }

  const all = await prisma.mosquee.findMany();
  const candidates = all.filter(
    (m) =>
      !EXCLUDED_MOSQUEE.some((r) => r.test(m.nom)) &&
      (/AMP/i.test(m.nom) || /Plaisir/i.test(m.nom))
  );

  if (candidates.length === 1) return candidates[0];
  if (candidates.length === 0) {
    throw new Error(
      `Mosquée AMP introuvable. Définissez AMP_MOSQUEE_ID ou créez « ${AMP_MOSQUEE_NOM} ».`
    );
  }
  throw new Error(
    `Plusieurs mosquées AMP : ${candidates.map((m) => m.nom).join(", ")}. Définissez AMP_MOSQUEE_ID.`
  );
}

export { AMP_MOSQUEE_NOM };
