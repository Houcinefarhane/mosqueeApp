import type { Role } from "@prisma/client";

export interface MessageUser {
  id: string;
  prenom: string;
  nom: string;
  role: Role;
}

export interface MessageItem {
  id: string;
  objet: string;
  contenu: string;
  lu: boolean;
  createdAt: string;
  senderId: string;
  receiverId: string;
  sender: MessageUser;
  receiver: MessageUser;
}

export interface DestinataireOption {
  id: string;
  prenom: string;
  nom: string;
  role: Role;
  email: string;
}

export type MessageBox = "received" | "sent";
