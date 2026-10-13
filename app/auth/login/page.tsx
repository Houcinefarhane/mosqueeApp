import LoginClient from "@/components/auth/LoginClient";

type LoginPageProps = {
  searchParams?: { message?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <LoginClient message={searchParams?.message} />;
}
