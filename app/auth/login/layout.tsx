import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion - MadrasaApp",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
