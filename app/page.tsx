import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Redirection selon le rôle
  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin");
    case "PROFESSEUR":
      redirect("/professeur");
    case "PARENT":
      redirect("/parent");
    case "ELEVE":
      redirect("/eleve");
    default:
      redirect("/auth/login");
  }
}
