import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: string;
      credits: number;
      subscription: string;
    };
  }

  interface User {
    role: string;
    credits: number;
    subscription: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    credits: number;
    subscription: string;
  }
}