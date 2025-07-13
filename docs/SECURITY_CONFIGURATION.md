# Security Configuration Guide

## Critical Security Actions Required

### 1. Rotate All Credentials Immediately

The following credentials have been exposed and must be rotated:

1. **Database Credentials**
   - Current: root/Test@1234
   - Action: Change database password and create a non-root user with limited permissions

2. **JWT Secret**
   - Current: Hardcoded fallback and exposed in .env
   - Action: Generate new 256-bit secret: `openssl rand -hex 32`

3. **TaxJar API Key**
   - Current: cb78f404a15934637291de749a04b0f3
   - Action: Regenerate in TaxJar dashboard

4. **Encryption Key**
   - Current: 5269318f5fbc3837ea1c9cd51daddf5be5bc2f8b5c63c5fcd2abb0b760770b03
   - Action: Generate new key: `openssl rand -hex 32`

### 2. Environment Variables Setup

1. Copy `.env.example` to `.env`
2. Generate secure values for all secrets:
   ```bash
   # Generate JWT secret
   openssl rand -hex 64
   
   # Generate encryption key
   openssl rand -hex 32
   
   # Generate session secret
   openssl rand -hex 32
   ```

3. Never commit `.env` files to version control

### 3. Security Fixes Applied

1. **JWT Secret Fallback** - Fixed in `/lib/auth.ts`
   - Now throws error if JWT_SECRET is not set
   - No more hardcoded fallback values

2. **SQL Injection** - Fixed in `/lib/services/ProductService.ts`
   - Added validation for sortBy and sortOrder parameters
   - Using whitelist approach for allowed columns

3. **File Upload Validation** - Fixed in `/lib/security/validation.ts`
   - Proper extension validation using lastIndexOf
   - MIME type to extension matching
   - Double extension detection
   - Null byte protection

### 4. Additional Security Measures

1. **Use Environment-Specific Configs**
   - Never use production credentials in development
   - Use separate databases for dev/staging/production
   - Implement proper secrets management (AWS Secrets Manager, HashiCorp Vault)

2. **Database Security**
   - Create application-specific MySQL user with limited permissions
   - Remove root access from application
   - Use SSL/TLS for database connections in production

3. **API Security**
   - Implement API rate limiting (already in place)
   - Add request signing for sensitive operations
   - Log all admin actions for audit trail

4. **Payment Security**
   - All payment credentials are already encrypted with AES-256-GCM
   - Ensure PCI compliance for handling payment data
   - Never log payment credentials or sensitive data

### 5. Security Monitoring

1. **Set up alerts for:**
   - Failed login attempts exceeding threshold
   - Unusual file upload patterns
   - SQL injection attempts
   - Unauthorized API access attempts

2. **Regular Security Audits:**
   - Run dependency vulnerability scans: `npm audit`
   - Perform penetration testing quarterly
   - Review access logs monthly

### 6. Production Deployment Checklist

- [ ] All credentials rotated and secured
- [ ] Environment variables properly configured
- [ ] HTTPS/SSL certificates installed
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Rate limiting enabled on all endpoints
- [ ] File upload restrictions in place
- [ ] Database using non-root user
- [ ] Logging and monitoring configured
- [ ] Backup and disaster recovery plan tested
- [ ] Security incident response plan documented

## Emergency Response

If credentials are compromised:

1. Immediately rotate all affected credentials
2. Check access logs for unauthorized usage
3. Notify affected users if data was accessed
4. Document incident and remediation steps
5. Review and improve security practices

## Security Contact

For security issues or questions:
- Email: security@smartblindshub.com
- Include [SECURITY] in subject line for priority handling