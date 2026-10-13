import ChangePasswordClient from "@/components/auth/ChangePasswordClient";
import Logo from "@/components/brand/Logo";

export const metadata = { title: "Changer le mot de passe" };

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-nuit p-4">
      <Logo size={64} withWordmark onDark className="mb-8" />
      <ChangePasswordClient />
    </div>
  );
}
