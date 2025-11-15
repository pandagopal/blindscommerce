import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';
import TwitterProvider from 'next-auth/providers/twitter';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { userService } from '@/lib/services/singletons';

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

        // Check if user already exists using userService
        const existingUser = await userService.getUserByEmail(user.email);

        if (existingUser) {
          
          // Only allow social login for CUSTOMER role users
          if (existingUser.role !== 'customer') {
            return false;
          }

          if (!existingUser.is_active) {
            return false;
          }

          // Update social login information
          await userService.update(existingUser.user_id, {
            social_provider: account.provider,
            social_id: account.providerAccountId,
            profile_image: user.image || null,
            last_login: new Date(),
            updated_at: new Date()
          });

          return true;
        }

        // Create new CUSTOMER user for social login
        const firstName = user.name?.split(' ')[0] || '';
        const lastName = user.name?.split(' ').slice(1).join(' ') || '';
        
        // Generate a random password for social users (they won't use it)
        const randomPassword = randomBytes(12).toString('base64').replace(/[+/=]/g, '').slice(0, 16);
        const hashedPassword = await bcrypt.hash(randomPassword, 12);

        // Create new user using userService
        await userService.createUser({
          first_name: firstName,
          last_name: lastName,
          email: user.email,
          password: randomPassword, // Service will hash it
          role: 'customer', // ONLY create customer accounts via social login
          is_active: 1,
          social_provider: account.provider,
          social_id: account.providerAccountId,
          profile_image: user.image || null,
          email_verified: 1 // Social login users are considered email verified
        });

        return true;

      } catch (error) {
        console.error('Error in social login:', error);
        return false;
      }
    },

    async jwt({ token, user, account }): Promise<any> {
      if (account && user) {
        try {
          const dbUser = await userService.getUserByEmail(user.email!);

          if (dbUser) {
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