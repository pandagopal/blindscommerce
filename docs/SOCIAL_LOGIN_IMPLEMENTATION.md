# Social Login Implementation - CUSTOMER Users Only

## Overview

Social login is implemented for **CUSTOMER users only**. Business users (vendors, admins, sales, installers) must use email/password authentication for security and access control reasons.

## Supported Providers

- **Google** - OAuth 2.0
- **Facebook** - OAuth 2.0  
- **Apple** - Sign in with Apple
- **Twitter** - OAuth 2.0 (v2)

## Architecture

### NextAuth Configuration
- **File**: `/lib/authOptions.ts`
- **Strategy**: JWT tokens (consistent with existing auth system)
- **Session Duration**: 24 hours (matches existing JWT expiration)

### Database Schema
- **Migration**: `/database/add_social_login_fields.sql`
- **New Fields**: `social_provider`, `social_id`, `profile_image`, `email_verified`, `last_login`
- **Additional Tables**: `social_accounts`, `verification_tokens`, `sessions`

### UI Components
- **SocialLoginButtons**: `/components/auth/SocialLoginButtons.tsx`
- **NextAuthProvider**: `/components/providers/NextAuthProvider.tsx`
- **Integration**: Login and Register pages

## Security Features

### Role-Based Access Control
```typescript
// Only customer role users can use social login
if (existingUser.role !== 'customer') {
  console.log(`Social login denied for non-customer user: ${user.email}, role: ${existingUser.role}`);
  return false;
}
```

### Account Validation
- Email verification required
- Active account status checked
- Invalid accounts rejected gracefully

### Data Protection
- Social tokens handled securely
- Profile images stored as URLs only
- No sensitive social data stored locally

## User Flow

### New Customer Registration
1. User clicks social provider button
2. Provider authentication (external)
3. NextAuth receives user data
4. New customer account created automatically
5. User redirected to `/account` dashboard

### Existing Customer Login
1. User clicks social provider button
2. Provider authentication (external)
3. NextAuth matches email to existing customer
4. Social provider info updated in profile
5. User logged in and redirected to `/account`

### Business User Attempt
1. User clicks social provider button
2. Provider authentication (external)  
3. NextAuth checks existing user role
4. **Access denied** for non-customer roles
5. User redirected to login with error

## Environment Variables

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth  
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Apple OAuth
APPLE_CLIENT_ID=your-apple-service-id
APPLE_CLIENT_SECRET=your-apple-client-secret-jwt

# Twitter OAuth
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
```

## Provider Setup

### Google OAuth Setup
1. Go to [Google Console](https://console.developers.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URL: `{NEXTAUTH_URL}/api/auth/callback/google`

### Facebook OAuth Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create new app
3. Add Facebook Login product
4. Configure OAuth redirect URLs
5. Add redirect URL: `{NEXTAUTH_URL}/api/auth/callback/facebook`

### Apple Sign In Setup
1. Go to [Apple Developer](https://developer.apple.com/account/resources/identifiers/list/serviceId)
2. Create new Service ID
3. Configure Sign in with Apple
4. Add redirect URL: `{NEXTAUTH_URL}/api/auth/callback/apple`
5. Generate client secret JWT

### Twitter OAuth Setup
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create new app
3. Enable OAuth 2.0
4. Add redirect URL: `{NEXTAUTH_URL}/api/auth/callback/twitter`

## Database Migration

Run the migration to add social login support:

```bash
mysql -u root -p blindscommerce_test < database/add_social_login_fields.sql
```

## API Endpoints

### NextAuth Routes
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler
- `GET /api/auth/signin` - Sign in page
- `GET /api/auth/callback/[provider]` - OAuth callbacks
- `GET /api/auth/signout` - Sign out

### Integration with Existing Auth
- Works alongside existing `/api/auth/login` endpoint
- Maintains compatibility with JWT-based system
- Preserves role-based dashboard redirects

## Testing

### Test Coverage
- Customer account creation via social login
- Existing customer social login
- Non-customer role rejection
- Inactive account rejection
- JWT token handling
- Session management
- Provider-specific functionality

### Test File
`__tests__/social-login/social-authentication.test.ts`

## Error Handling

### Common Error Scenarios
- **Non-customer role**: Access denied with clear message
- **Inactive account**: Login blocked for inactive customers
- **Missing email**: Provider must provide email address
- **Database errors**: Graceful fallback with error logging
- **Provider errors**: Redirect to login with error parameter

### Error Messages
- User-friendly error messages displayed
- Business users directed to email/password login
- Clear distinction between customer and business access

## Production Deployment

### Security Checklist
- [ ] All environment variables configured
- [ ] OAuth redirect URLs updated for production domain
- [ ] NEXTAUTH_SECRET set to secure random value
- [ ] Database migration applied
- [ ] SSL/HTTPS enabled for OAuth redirects

### Monitoring
- Track social login success/failure rates
- Monitor for unusual authentication patterns
- Log failed attempts by non-customer users
- Alert on database connection issues

## Business Rules

### Customer-Only Policy
- **Rationale**: Business users require controlled access with specific role permissions
- **Security**: Prevents unauthorized business account creation
- **Compliance**: Maintains audit trail for business user access
- **User Experience**: Customers get convenient social login, business users get secure dedicated login

### Future Enhancements
- **MFA for Business Users**: Consider adding MFA for business accounts
- **Social Account Linking**: Allow customers to link multiple social accounts
- **Profile Sync**: Sync profile updates from social providers
- **Analytics**: Track customer acquisition by social provider

## Troubleshooting

### Common Issues
1. **"Access denied" for business users** - Expected behavior, direct to email/password login
2. **OAuth redirect errors** - Check redirect URLs in provider console
3. **Database connection errors** - Verify migration applied and connection config
4. **Missing environment variables** - Check all required provider credentials

### Debug Mode
Enable NextAuth debug logging:
```bash
NEXTAUTH_DEBUG=1
```

## Support

For issues with social login implementation:
1. Check provider-specific documentation
2. Verify environment variables
3. Test with customer test accounts
4. Review NextAuth logs for detailed error information