
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import { User } from '@/models/user';
import bcrypt from 'bcrypt';
import { Db } from 'mongodb';

async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB_NAME,
  }),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }
        try {
          const db = await getDb();
          const user = await db.collection<User>('users').findOne({ email: credentials.email });

          if (user && user.password && (await bcrypt.compare(credentials.password, user.password))) {
            // Return a user object that NextAuth can use
            return {
              id: user._id!.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
          console.log("Authentication failed: Invalid credentials for email:", credentials.email);
          return null;
        } catch (error) {
            console.error("Authorization Error:", error);
            // Returning null or an object with an error message is safer than letting it crash
            return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
