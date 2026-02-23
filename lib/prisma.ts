import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Gestion des erreurs de connexion et reconnexion automatique
prisma.$on("error" as never, (e: any) => {
  console.error("Erreur Prisma:", e);
});

// Fonction helper pour exécuter des requêtes avec reconnexion automatique
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Vérifier et maintenir la connexion
      try {
        await prisma.$connect();
      } catch (connectError) {
        // Si la connexion échoue, on continue quand même
        // Prisma peut se reconnecter automatiquement
      }
      
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Si c'est une erreur de connexion, on réessaie
      const isConnectionError =
        error.message?.includes("Server has closed the connection") ||
        error.message?.includes("Connection closed") ||
        error.message?.includes("Connection terminated") ||
        error.code === "P1001" ||
        error.code === "P1017" ||
        error.code === "57P01"; // PostgreSQL: terminating connection due to administrator command
      
      if (isConnectionError && i < maxRetries - 1) {
        console.warn(`Tentative ${i + 1}/${maxRetries} - Reconnexion...`);
        
        // Déconnecter proprement
        try {
          await prisma.$disconnect();
        } catch {
          // Ignorer les erreurs de déconnexion
        }
        
        // Attendre avant de réessayer (backoff exponentiel)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
        
        // Continuer la boucle pour réessayer
        continue;
      } else {
        // Si ce n'est pas une erreur de connexion ou dernière tentative, on relance l'erreur
        throw error;
      }
    }
  }

  throw lastError || new Error("Échec après plusieurs tentatives");
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
