import { z } from "zod";

export const createMessageSchema = z.object({
  receiverId: z.string().min(1, "Destinataire requis"),
  objet: z.string().min(1, "L'objet est requis").max(200, "Objet trop long"),
  contenu: z.string().min(1, "Le contenu est requis").max(5000, "Contenu trop long"),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
