import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      mosqueeId: string;
      mustChangePassword?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    mosqueeId: string;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role: string;
    mosqueeId: string;
    mustChangePassword?: boolean;
  }
}
