import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';
import TwitterProvider from 'next-auth/providers/twitter';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2';

interface SocialUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0", // Twitter API v2
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }): Promise<boolean> {
      try {
        if (!account || !user.email) {
          return false;
        }

        const pool = await getPool();
        
        // Check if user already exists
        const [existingUsers] = await pool.execute<RowDataPacket[]>(
          'SELECT user_id, role, is_active FROM users WHERE email = ?',
          [user.email]
        );

        if (existingUsers.length > 0) {
          const existingUser = existingUsers[0];
          
          // Only allow social login for CUSTOMER role users
          if (existingUser.role !== 'customer') {
            console.log(`Social login denied for non-customer user: ${user.email}, role: ${existingUser.role}`);
            return false;
          }

          if (!existingUser.is_active) {
            console.log(`Social login denied for inactive user: ${user.email}`);
            return false;
          }

          // Update social login information
          await pool.execute(
            `UPDATE users SET 
             social_provider = ?, 
             social_id = ?, 
             profile_image = ?,
             last_login = NOW(),
             updated_at = NOW()
             WHERE user_id = ?`,
            [account.provider, account.providerAccountId, user.image, existingUser.user_id]
          );

          return true;
        }

        // Create new CUSTOMER user for social login
        const firstName = user.name?.split(' ')[0] || '';
        const lastName = user.name?.split(' ').slice(1).join(' ') || '';
        
        // Generate a random password for social users (they won't use it)
        const randomPassword = Math.random().toString(36).slice(-12);
        const hashedPassword = await bcrypt.hash(randomPassword, 12);

        const [result] = await pool.execute(
          `INSERT INTO users (
            first_name, last_name, email, password_hash, role, 
            is_active, social_provider, social_id, profile_image,
            email_verified, created_at, updated_at, last_login
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
          [
            firstName,
            lastName, 
            user.email,
            hashedPassword,
            'customer', // ONLY create customer accounts via social login
            true,
            account.provider,
            account.providerAccountId,
            user.image,
            true // Social login users are considered email verified
          ]
        );

        console.log(`New customer created via ${account.provider} social login: ${user.email}`);
        return true;

      } catch (error) {
        console.error('Error in social login:', error);
        return false;
      }
    },

    async jwt({ token, user, account }): Promise<any> {
      if (account && user) {
        try {
          const pool = await getPool();
          const [users] = await pool.execute<RowDataPacket[]>(
            'SELECT user_id, role, first_name, last_name, is_active FROM users WHERE email = ?',
            [user.email]
          );

          if (users.length > 0) {
            const dbUser = users[0];
            token.userId = dbUser.user_id;
            token.role = dbUser.role;
            token.firstName = dbUser.first_name;
            token.lastName = dbUser.last_name;
            token.isActive = dbUser.is_active;
          }
        } catch (error) {
          console.error('Error fetching user data for JWT:', error);
        }
      }
      return token;
    },

    async session({ session, token }): Promise<any> {
      session.user.id = token.userId as string;
      session.user.role = token.role as string;
      session.user.firstName = token.firstName as string;
      session.user.lastName = token.lastName as string;
      session.user.isActive = token.isActive as boolean;
      return session;
    },
  },
  pages: {
    signIn: '/login', // Redirect to our custom login page
    error: '/login', // Redirect errors to login page with error parameter
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (same as our JWT tokens)
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};