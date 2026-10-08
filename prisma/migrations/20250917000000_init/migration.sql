-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROFESSEUR', 'PARENT', 'ELEVE');

-- CreateEnum
CREATE TYPE "StatutPresence" AS ENUM ('PRESENT', 'ABSENT', 'RETARD', 'EXCUSE');

-- CreateEnum
CREATE TYPE "TypeDevoir" AS ENUM ('DEVOIR', 'CAHIER_TEXTE');

-- CreateTable
CREATE TABLE "Mosquee" (
    "id" STRING NOT NULL,
    "nom" STRING NOT NULL,
    "adresse" STRING,
    "telephone" STRING,
    "email" STRING,
    "logo" STRING,
    "plan" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mosquee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" STRING NOT NULL,
    "email" STRING NOT NULL,
    "password" STRING NOT NULL,
    "nom" STRING NOT NULL,
    "prenom" STRING NOT NULL,
    "telephone" STRING,
    "role" "Role" NOT NULL,
    "mosqueeId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classe" (
    "id" STRING NOT NULL,
    "nom" STRING NOT NULL,
    "niveau" STRING NOT NULL,
    "professeurId" STRING,
    "mosqueeId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devoir" (
    "id" STRING NOT NULL,
    "titre" STRING NOT NULL,
    "contenu" STRING NOT NULL,
    "matiere" STRING NOT NULL,
    "type" "TypeDevoir" NOT NULL DEFAULT 'DEVOIR',
    "dateLimite" TIMESTAMP(3),
    "classeId" STRING NOT NULL,
    "professeurId" STRING NOT NULL,
    "mosqueeId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devoir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eleve" (
    "id" STRING NOT NULL,
    "nom" STRING NOT NULL,
    "prenom" STRING NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "telephone" STRING,
    "email" STRING,
    "classeId" STRING NOT NULL,
    "parentId" STRING,
    "userId" STRING,
    "mosqueeId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Eleve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appel" (
    "id" STRING NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "classeId" STRING NOT NULL,
    "professeurId" STRING NOT NULL,
    "mosqueeId" STRING NOT NULL,
    "commentaireSeance" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presence" (
    "id" STRING NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutPresence" NOT NULL,
    "eleveId" STRING NOT NULL,
    "classeId" STRING NOT NULL,
    "professeurId" STRING NOT NULL,
    "mosqueeId" STRING NOT NULL,
    "appelId" STRING,
    "commentaire" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSession" (
    "id" STRING NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classeId" STRING NOT NULL,
    "professeurId" STRING NOT NULL,
    "mosqueeId" STRING NOT NULL,
    "matiere" STRING NOT NULL,
    "noteMax" FLOAT8 NOT NULL DEFAULT 20,
    "commentaireSeance" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" STRING NOT NULL,
    "valeur" FLOAT8 NOT NULL,
    "noteMax" FLOAT8 NOT NULL DEFAULT 20,
    "matiere" STRING NOT NULL,
    "commentaire" STRING,
    "eleveId" STRING NOT NULL,
    "professeurId" STRING NOT NULL,
    "mosqueeId" STRING NOT NULL,
    "sessionId" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planning" (
    "id" STRING NOT NULL,
    "jour" STRING NOT NULL,
    "heureDebut" STRING NOT NULL,
    "heureFin" STRING NOT NULL,
    "matiere" STRING NOT NULL,
    "classeId" STRING NOT NULL,
    "mosqueeId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Planning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annonce" (
    "id" STRING NOT NULL,
    "titre" STRING NOT NULL,
    "contenu" STRING NOT NULL,
    "auteurId" STRING NOT NULL,
    "mosqueeId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Annonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" STRING NOT NULL,
    "objet" STRING NOT NULL,
    "contenu" STRING NOT NULL,
    "lu" BOOL NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mosqueeId" STRING NOT NULL,
    "senderId" STRING NOT NULL,
    "receiverId" STRING NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mosquee_nom_idx" ON "Mosquee"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_mosqueeId_idx" ON "User"("mosqueeId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Classe_mosqueeId_idx" ON "Classe"("mosqueeId");

-- CreateIndex
CREATE INDEX "Classe_professeurId_idx" ON "Classe"("professeurId");

-- CreateIndex
CREATE INDEX "Classe_nom_idx" ON "Classe"("nom");

-- CreateIndex
CREATE INDEX "Devoir_classeId_idx" ON "Devoir"("classeId");

-- CreateIndex
CREATE INDEX "Devoir_professeurId_idx" ON "Devoir"("professeurId");

-- CreateIndex
CREATE INDEX "Devoir_mosqueeId_idx" ON "Devoir"("mosqueeId");

-- CreateIndex
CREATE INDEX "Devoir_type_idx" ON "Devoir"("type");

-- CreateIndex
CREATE INDEX "Devoir_dateLimite_idx" ON "Devoir"("dateLimite");

-- CreateIndex
CREATE INDEX "Devoir_createdAt_idx" ON "Devoir"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Eleve_userId_key" ON "Eleve"("userId");

-- CreateIndex
CREATE INDEX "Eleve_mosqueeId_idx" ON "Eleve"("mosqueeId");

-- CreateIndex
CREATE INDEX "Eleve_classeId_idx" ON "Eleve"("classeId");

-- CreateIndex
CREATE INDEX "Eleve_parentId_idx" ON "Eleve"("parentId");

-- CreateIndex
CREATE INDEX "Eleve_userId_idx" ON "Eleve"("userId");

-- CreateIndex
CREATE INDEX "Eleve_email_idx" ON "Eleve"("email");

-- CreateIndex
CREATE INDEX "Appel_classeId_idx" ON "Appel"("classeId");

-- CreateIndex
CREATE INDEX "Appel_date_idx" ON "Appel"("date");

-- CreateIndex
CREATE INDEX "Appel_mosqueeId_idx" ON "Appel"("mosqueeId");

-- CreateIndex
CREATE INDEX "Appel_professeurId_idx" ON "Appel"("professeurId");

-- CreateIndex
CREATE UNIQUE INDEX "Appel_classeId_date_key" ON "Appel"("classeId", "date");

-- CreateIndex
CREATE INDEX "Presence_eleveId_idx" ON "Presence"("eleveId");

-- CreateIndex
CREATE INDEX "Presence_classeId_idx" ON "Presence"("classeId");

-- CreateIndex
CREATE INDEX "Presence_date_idx" ON "Presence"("date");

-- CreateIndex
CREATE INDEX "Presence_mosqueeId_idx" ON "Presence"("mosqueeId");

-- CreateIndex
CREATE INDEX "Presence_professeurId_idx" ON "Presence"("professeurId");

-- CreateIndex
CREATE INDEX "Presence_appelId_idx" ON "Presence"("appelId");

-- CreateIndex
CREATE UNIQUE INDEX "Presence_eleveId_classeId_date_key" ON "Presence"("eleveId", "classeId", "date");

-- CreateIndex
CREATE INDEX "NoteSession_classeId_idx" ON "NoteSession"("classeId");

-- CreateIndex
CREATE INDEX "NoteSession_date_idx" ON "NoteSession"("date");

-- CreateIndex
CREATE INDEX "NoteSession_mosqueeId_idx" ON "NoteSession"("mosqueeId");

-- CreateIndex
CREATE INDEX "NoteSession_professeurId_idx" ON "NoteSession"("professeurId");

-- CreateIndex
CREATE INDEX "NoteSession_matiere_idx" ON "NoteSession"("matiere");

-- CreateIndex
CREATE INDEX "Note_eleveId_idx" ON "Note"("eleveId");

-- CreateIndex
CREATE INDEX "Note_mosqueeId_idx" ON "Note"("mosqueeId");

-- CreateIndex
CREATE INDEX "Note_professeurId_idx" ON "Note"("professeurId");

-- CreateIndex
CREATE INDEX "Note_matiere_idx" ON "Note"("matiere");

-- CreateIndex
CREATE INDEX "Note_sessionId_idx" ON "Note"("sessionId");

-- CreateIndex
CREATE INDEX "Planning_classeId_idx" ON "Planning"("classeId");

-- CreateIndex
CREATE INDEX "Planning_mosqueeId_idx" ON "Planning"("mosqueeId");

-- CreateIndex
CREATE INDEX "Planning_jour_idx" ON "Planning"("jour");

-- CreateIndex
CREATE INDEX "Annonce_mosqueeId_idx" ON "Annonce"("mosqueeId");

-- CreateIndex
CREATE INDEX "Annonce_createdAt_idx" ON "Annonce"("createdAt");

-- CreateIndex
CREATE INDEX "Annonce_auteurId_idx" ON "Annonce"("auteurId");

-- CreateIndex
CREATE INDEX "Message_mosqueeId_idx" ON "Message"("mosqueeId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_lu_idx" ON "Message"("lu");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mosqueeId_fkey" FOREIGN KEY ("mosqueeId") REFERENCES "Mosquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classe" ADD CONSTRAINT "Classe_mosqueeId_fkey" FOREIGN KEY ("mosqueeId") REFERENCES "Mosquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classe" ADD CONSTRAINT "Classe_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devoir" ADD CONSTRAINT "Devoir_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devoir" ADD CONSTRAINT "Devoir_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devoir" ADD CONSTRAINT "Devoir_mosqueeId_fkey" FOREIGN KEY ("mosqueeId") REFERENCES "Mosquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_mosqueeId_fkey" FOREIGN KEY ("mosqueeId") REFERENCES "Mosquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appel" ADD CONSTRAINT "Appel_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appel" ADD CONSTRAINT "Appel_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appel" ADD CONSTRAINT "Appel_mosqueeId_fkey" FOREIGN KEY ("mosqueeId") REFERENCES "Mosquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_mosqueeId_fkey" FOREIGN KEY ("mosqueeId") REFERENCES "Mosquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_appelId_fkey" FOREIGN KEY ("appelId") REFERENCES "Appel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSession" ADD CONSTRAINT "NoteSession_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSession" ADD CONSTRAINT "NoteSession_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSession" ADD CONSTRAINT "NoteSession_mosqueeId_fkey" FOREIGN KEY ("mosqueeId") REFERENCES "Mosquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_mosqueeId_fkey" FOREIGN KEY ("mosqueeId") REFERENCES "Mosquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NoteSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planning" ADD CONSTRAINT "Planning_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planning" ADD CONSTRAINT "Planning_mosqueeId_fkey" FOREIGN KEY ("mosqueeId") REFERENCES "Mosquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annonce" ADD CONSTRAINT "Annonce_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annonce" ADD CONSTRAINT "Annonce_mosqueeId_fkey" FOREIGN KEY ("mosqueeId") REFERENCES "Mosquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_mosqueeId_fkey" FOREIGN KEY ("mosqueeId") REFERENCES "Mosquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

