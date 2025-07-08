#!/bin/bash

# Script to generate secure credentials for BlindsCommerce
# Run this script to generate new secure values for your .env file

echo "=== BlindsCommerce Secure Credential Generator ==="
echo ""
echo "This script will generate secure random values for your environment variables."
echo "Copy these values to your .env file and update them in your production systems."
echo ""
echo "⚠️  IMPORTANT: After updating credentials, you must:"
echo "   1. Update database password in MySQL"
echo "   2. Regenerate API keys in respective services (TaxJar, Stripe, etc.)"
echo "   3. Clear all active sessions"
echo "   4. Restart the application"
echo ""
echo "=== Generated Credentials ==="
echo ""

# Generate JWT Secret (64 bytes = 512 bits)
echo "# JWT Configuration"
echo "JWT_SECRET=$(openssl rand -hex 64)"
echo ""

# Generate Session Secret (32 bytes = 256 bits)
echo "# Session Secret"
echo "SESSION_SECRET=$(openssl rand -hex 32)"
echo ""

# Generate Encryption Key for Payment Credentials (32 bytes = 256 bits for AES-256)
echo "# Encryption Key for Payment Credentials (AES-256-GCM)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo ""

# Generate NextAuth Secret
echo "# NextAuth Configuration"
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)"
echo "NEXT_AUTH_SECRET=$(openssl rand -hex 32)"
echo ""

# Database Password Generator (16 characters, mixed case, numbers, special chars)
echo "# Database Configuration (Update in MySQL after generation)"
echo "DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-16)$(echo '!@#$%' | fold -w1 | shuf | head -1)"
echo ""

echo "=== Manual Steps Required ==="
echo ""
echo "1. Database Password:"
echo "   - Login to MySQL as root"
echo "   - Run: ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password_here';"
echo "   - Create app user: CREATE USER 'blindsapp'@'localhost' IDENTIFIED BY 'app_password_here';"
echo "   - Grant permissions: GRANT SELECT, INSERT, UPDATE, DELETE ON blindscommerce_test.* TO 'blindsapp'@'localhost';"
echo ""
echo "2. API Keys:"
echo "   - TaxJar: Login to https://app.taxjar.com and regenerate API key"
echo "   - Stripe: Login to https://dashboard.stripe.com and get new keys"
echo "   - Other payment providers: Regenerate in respective dashboards"
echo ""
echo "3. OAuth Credentials:"
echo "   - Update callback URLs if domain changes"
echo "   - Regenerate client secrets in provider dashboards"
echo ""
echo "=== Security Reminders ==="
echo "- Never commit .env files to version control"
echo "- Use different credentials for each environment"
echo "- Enable 2FA on all service accounts"
echo "- Rotate credentials every 90 days"
echo "- Monitor for unauthorized access"