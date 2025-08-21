
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import { User } from '@/models/user';
import { Db } from 'mongodb';

async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || 'coop_bank_db');
}

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB_NAME || 'coop_bank_db',
  }),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Dynamically import bcrypt only when needed to avoid server-start issues
        const bcrypt = await import('bcrypt');
        
        if (!credentials?.email || !credentials.password) {
          console.error("Authorization Error: Missing email or password.");
          return null;
        }

        try {
          const db = await getDb();
          const user = await db.collection<User>('users').findOne({ email: credentials.email });

          if (user && user.password) {
            const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
            if (isPasswordCorrect) {
              // Return the user object to be encoded in the JWT
              return {
                id: user._id!.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
              };
            }
          }
          
          console.log("Authentication failed: Invalid credentials for email:", credentials.email);
          return null; // Invalid credentials

        } catch (error) {
            console.error("Authorization Error:", error);
            // Throwing an error will show a generic error message on the client
            throw new Error("An error occurred during authentication.");
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    // The `jwt` callback is called when a JWT is created (i.e., on sign-in) 
    // or updated (i.e., whenever a session is accessed in the client).
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    // The `session` callback is called whenever a session is checked.
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as User['role'];
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login', // Redirect users to login page on error
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
