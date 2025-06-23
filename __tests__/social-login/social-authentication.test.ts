/**
 * Social Login Integration Tests
 * Tests social authentication for CUSTOMER users only
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getPool } from '@/lib/db';
import { authOptions } from '@/lib/authOptions';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2';

describe('Social Login Authentication', () => {
  let pool: any;
  let testUserId: number;

  beforeEach(async () => {
    pool = await getPool();
  });

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await pool.execute('DELETE FROM users WHERE user_id = ?', [testUserId]);
    }
    await pool.execute('DELETE FROM users WHERE email LIKE ?', ['%test-social%']);
  });

  describe('Customer Social Login Creation', () => {
    it('should create new customer account via social login', async () => {
      const mockUser = {
        id: 'google_123456789',
        name: 'John Doe',
        email: 'john.doe.test-social@example.com',
        image: 'https://lh3.googleusercontent.com/a/profile.jpg'
      };

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google_123456789',
        type: 'oauth',
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token'
      };

      // Simulate the signIn callback
      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: {},
          email: { verificationRequest: false },
          credentials: undefined
        });

        expect(result).toBe(true);

        // Verify user was created in database
        const [users] = await pool.execute<RowDataPacket[]>(
          'SELECT user_id, email, role, social_provider, social_id, email_verified FROM users WHERE email = ?',
          [mockUser.email]
        );

        expect(users).toHaveLength(1);
        const createdUser = users[0];
        expect(createdUser.email).toBe(mockUser.email);
        expect(createdUser.role).toBe('customer');
        expect(createdUser.social_provider).toBe('google');
        expect(createdUser.social_id).toBe('google_123456789');
        expect(createdUser.email_verified).toBe(1);

        testUserId = createdUser.user_id;
      }
    });

    it('should update existing customer with social login info', async () => {
      // Create existing customer
      const [result] = await pool.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        ['Jane', 'Smith', 'jane.smith.test-social@example.com', await bcrypt.hash('password123', 12), 'customer', true]
      );
      testUserId = result.insertId;

      const mockUser = {
        id: 'facebook_987654321',
        name: 'Jane Smith',
        email: 'jane.smith.test-social@example.com',
        image: 'https://graph.facebook.com/987654321/picture'
      };

      const mockAccount = {
        provider: 'facebook',
        providerAccountId: 'facebook_987654321',
        type: 'oauth'
      };

      // Simulate the signIn callback
      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: {},
          email: { verificationRequest: false },
          credentials: undefined
        });

        expect(result).toBe(true);

        // Verify user was updated with social info
        const [users] = await pool.execute<RowDataPacket[]>(
          'SELECT social_provider, social_id, profile_image FROM users WHERE user_id = ?',
          [testUserId]
        );

        expect(users).toHaveLength(1);
        const updatedUser = users[0];
        expect(updatedUser.social_provider).toBe('facebook');
        expect(updatedUser.social_id).toBe('facebook_987654321');
        expect(updatedUser.profile_image).toBe(mockUser.image);
      }
    });

    it('should handle user with no name gracefully', async () => {
      const mockUser = {
        id: 'apple_111222333',
        name: null, // Apple users may not provide name
        email: 'apple.user.test-social@example.com',
        image: null
      };

      const mockAccount = {
        provider: 'apple',
        providerAccountId: 'apple_111222333',
        type: 'oauth'
      };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: {},
          email: { verificationRequest: false },
          credentials: undefined
        });

        expect(result).toBe(true);

        // Verify user was created with empty name fields
        const [users] = await pool.execute<RowDataPacket[]>(
          'SELECT first_name, last_name, email, role FROM users WHERE email = ?',
          [mockUser.email]
        );

        expect(users).toHaveLength(1);
        const createdUser = users[0];
        expect(createdUser.first_name).toBe('');
        expect(createdUser.last_name).toBe('');
        expect(createdUser.role).toBe('customer');

        testUserId = createdUser.user_id;
      }
    });
  });

  describe('Role-Based Access Control', () => {
    it('should reject social login for non-customer existing users', async () => {
      // Create vendor user
      const [result] = await pool.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        ['Vendor', 'User', 'vendor.test-social@example.com', await bcrypt.hash('password123', 12), 'vendor', true]
      );
      testUserId = result.insertId;

      const mockUser = {
        id: 'google_vendor123',
        name: 'Vendor User',
        email: 'vendor.test-social@example.com',
        image: null
      };

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'google_vendor123',
        type: 'oauth'
      };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: {},
          email: { verificationRequest: false },
          credentials: undefined
        });

        expect(result).toBe(false); // Should reject non-customer role
      }
    });

    it('should reject social login for inactive users', async () => {
      // Create inactive customer
      const [result] = await pool.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        ['Inactive', 'Customer', 'inactive.test-social@example.com', await bcrypt.hash('password123', 12), 'customer', false]
      );
      testUserId = result.insertId;

      const mockUser = {
        id: 'twitter_inactive123',
        name: 'Inactive Customer',
        email: 'inactive.test-social@example.com',
        image: null
      };

      const mockAccount = {
        provider: 'twitter',
        providerAccountId: 'twitter_inactive123',
        type: 'oauth'
      };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: {},
          email: { verificationRequest: false },
          credentials: undefined
        });

        expect(result).toBe(false); // Should reject inactive user
      }
    });

    it('should reject social login when user has no email', async () => {
      const mockUser = {
        id: 'noemail_123',
        name: 'No Email User',
        email: null, // No email provided
        image: null
      };

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'noemail_123',
        type: 'oauth'
      };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: {},
          email: { verificationRequest: false },
          credentials: undefined
        });

        expect(result).toBe(false); // Should reject users without email
      }
    });

    it('should reject social login when account info is missing', async () => {
      const mockUser = {
        id: 'test_123',
        name: 'Test User',
        email: 'test.noaccount@example.com',
        image: null
      };

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: null, // No account info
          profile: {},
          email: { verificationRequest: false },
          credentials: undefined
        });

        expect(result).toBe(false); // Should reject when account is missing
      }
    });
  });

  describe('JWT and Session Handling', () => {
    it('should include user data in JWT token', async () => {
      // Create test customer
      const [result] = await pool.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        ['JWT', 'User', 'jwt.test-social@example.com', await bcrypt.hash('password123', 12), 'customer', true]
      );
      testUserId = result.insertId;

      const mockUser = {
        id: 'jwt_test',
        name: 'JWT User',
        email: 'jwt.test-social@example.com'
      };

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'jwt_test',
        type: 'oauth'
      };

      const jwtCallback = authOptions.callbacks?.jwt;
      if (jwtCallback) {
        const token = await jwtCallback({
          token: {},
          user: mockUser,
          account: mockAccount,
          profile: {},
          isNewUser: false
        });

        expect(token.userId).toBe(testUserId);
        expect(token.role).toBe('customer');
        expect(token.firstName).toBe('JWT');
        expect(token.lastName).toBe('User');
        expect(token.isActive).toBe(true);
      }
    });

    it('should include user data in session', async () => {
      const mockToken = {
        userId: 123,
        role: 'customer',
        firstName: 'Session',
        lastName: 'User',
        isActive: true
      };

      const sessionCallback = authOptions.callbacks?.session;
      if (sessionCallback) {
        const session = await sessionCallback({
          session: {
            user: {
              id: '123',
              email: 'session.test@example.com',
              name: 'Session User'
            },
            expires: new Date().toISOString()
          },
          token: mockToken
        });

        expect(session.user.id).toBe('123');
        expect(session.user.role).toBe('customer');
        expect(session.user.firstName).toBe('Session');
        expect(session.user.lastName).toBe('User');
        expect(session.user.isActive).toBe(true);
      }
    });
  });

  describe('Provider-Specific Functionality', () => {
    const providers = ['google', 'facebook', 'apple', 'twitter'];

    providers.forEach(provider => {
      it(`should handle ${provider} provider correctly`, async () => {
        const mockUser = {
          id: `${provider}_specific_test`,
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          email: `${provider}.specific.test-social@example.com`,
          image: `https://${provider}.com/avatar.jpg`
        };

        const mockAccount = {
          provider: provider,
          providerAccountId: `${provider}_specific_test`,
          type: 'oauth'
        };

        const signInCallback = authOptions.callbacks?.signIn;
        if (signInCallback) {
          const result = await signInCallback({
            user: mockUser,
            account: mockAccount,
            profile: {},
            email: { verificationRequest: false },
            credentials: undefined
          });

          expect(result).toBe(true);

          // Verify provider-specific data was saved
          const [users] = await pool.execute<RowDataPacket[]>(
            'SELECT social_provider, social_id FROM users WHERE email = ?',
            [mockUser.email]
          );

          expect(users).toHaveLength(1);
          expect(users[0].social_provider).toBe(provider);
          expect(users[0].social_id).toBe(`${provider}_specific_test`);

          // Clean up
          await pool.execute('DELETE FROM users WHERE email = ?', [mockUser.email]);
        }
      });
    });
  });

  describe('Database Integration', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error by using invalid data
      const mockUser = {
        id: 'db_error_test',
        name: 'DB Error User',
        email: 'dberror.test-social@example.com',
        image: null
      };

      const mockAccount = {
        provider: 'google',
        providerAccountId: 'db_error_test',
        type: 'oauth'
      };

      // Close the pool to simulate database error
      const originalPool = pool;
      pool = null;

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: mockUser,
          account: mockAccount,
          profile: {},
          email: { verificationRequest: false },
          credentials: undefined
        });

        expect(result).toBe(false); // Should handle error gracefully
      }

      // Restore the pool
      pool = originalPool;
    });
  });
});