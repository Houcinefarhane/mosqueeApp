import { redirect } from "next/navigation";

/** Redirection réelle gérée par le middleware (JWT). Secours si matcher absent. */
export default function Home() {
  redirect("/auth/login");
}
