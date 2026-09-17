import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Charger les variables d'environnement
config();

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔍 Test de connexion à la base de données...\n");
    
    // Test de connexion simple
    await prisma.$connect();
    console.log("✅ Connexion à la base de données réussie !\n");
    
    // Vérifier si les tables existent
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    
    console.log(`📊 Tables trouvées (${tables.length}) :`);
    tables.forEach((table) => {
      console.log(`   - ${table.tablename}`);
    });
    
    // Compter les enregistrements dans chaque table principale
    console.log("\n📈 Statistiques :");
    const [mosquees, users, classes, eleves] = await Promise.all([
      prisma.mosquee.count().catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.classe.count().catch(() => 0),
      prisma.eleve.count().catch(() => 0),
    ]);
    
    console.log(`   - Mosquées: ${mosquees}`);
    console.log(`   - Utilisateurs: ${users}`);
    console.log(`   - Classes: ${classes}`);
    console.log(`   - Élèves: ${eleves}`);
    
    console.log("\n✅ La base de données est correctement configurée !");
    
  } catch (error: any) {
    console.error("\n❌ Erreur de connexion à la base de données :");
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes("DATABASE_URL")) {
      console.log("💡 Solution :");
      console.log("   1. Créez un fichier .env à la racine du projet");
      console.log("   2. Ajoutez votre DATABASE_URL (ex: Neon PostgreSQL)");
      console.log("   3. Format: DATABASE_URL=\"postgresql://user:password@host:5432/db?sslmode=require\"");
      console.log("   4. Relancez: npm run db:push");
    } else if (error.message.includes("P1001") || error.message.includes("connect")) {
      console.log("💡 Solution :");
      console.log("   - Vérifiez que votre URL DATABASE_URL est correcte");
      console.log("   - Vérifiez que la base de données est accessible");
      console.log("   - Vérifiez vos credentials");
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
