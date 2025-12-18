import 'next-auth';
import { Role } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      familyId: string;
    };
  }

  interface User {
    role: Role;
    familyId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    familyId: string;
  }
}
