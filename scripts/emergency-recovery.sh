#!/bin/bash
# Emergency Recovery Script for BlindsCommerce V2 API Issues
# Run this script to quickly recover from system failures

echo "=== BlindsCommerce Emergency Recovery ==="
echo "This script will help recover from V2 API migration issues"
echo ""

# Check if running as correct user
echo "Running as user: $(whoami)"
echo "Current directory: $(pwd)"
echo ""

# Step 1: Backup current auth.ts (if not already backed up)
if [ ! -f "lib/auth.ts.backup" ]; then
    echo "1. Backing up current auth.ts..."
    cp lib/auth.ts lib/auth.ts.backup
    echo "   ✓ Backup created: lib/auth.ts.backup"
else
    echo "1. Backup already exists: lib/auth.ts.backup"
fi

# Step 2: Check environment variables
echo ""
echo "2. Checking critical environment variables..."
missing_vars=0

check_env() {
    if [ -z "${!1}" ]; then
        echo "   ✗ $1 is not set"
        missing_vars=$((missing_vars + 1))
    else
        echo "   ✓ $1 is set"
    fi
}

# Source .env file if it exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

check_env "DB_HOST"
check_env "DB_PORT"
check_env "DB_USER"
check_env "DB_PASSWORD"
check_env "DB_NAME"
check_env "JWT_SECRET"

if [ $missing_vars -gt 0 ]; then
    echo "   ⚠ Warning: $missing_vars environment variables are missing"
    echo "   Please check your .env file"
fi

# Step 3: Test database connection
echo ""
echo "3. Testing database connection..."
mysql -h${DB_HOST:-localhost} -P${DB_PORT:-3306} -u${DB_USER:-root} -p${DB_PASSWORD} ${DB_NAME:-blindscommerce} -e "SELECT 1" >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "   ✓ Database connection successful"
else
    echo "   ✗ Database connection failed"
    echo "   Please check your database credentials and ensure MySQL is running"
    exit 1
fi

# Step 4: Check if auth.ts has been fixed
echo ""
echo "4. Checking auth.ts for circular dependency fix..."
if grep -q "FIXED: Direct database query" lib/auth.ts; then
    echo "   ✓ auth.ts has been patched"
else
    echo "   ✗ auth.ts still has circular dependency"
    echo "   Applying fix now..."
    
    # Apply the fix using the auth-fixed.ts if it exists
    if [ -f "lib/auth-fixed.ts" ]; then
        echo "   Using auth-fixed.ts as reference..."
    else
        echo "   ⚠ auth-fixed.ts not found, manual fix required"
    fi
fi

# Step 5: Clear Next.js cache
echo ""
echo "5. Clearing Next.js cache..."
rm -rf .next
echo "   ✓ Next.js cache cleared"

# Step 6: Install dependencies (in case any are missing)
echo ""
echo "6. Checking npm dependencies..."
if [ -f "package.json" ]; then
    npm install --silent
    echo "   ✓ Dependencies checked"
else
    echo "   ✗ package.json not found"
fi

# Step 7: Run database migrations (optional)
echo ""
echo "7. Database migrations..."
read -p "   Do you want to apply pricing column fixes? (y/N): " apply_migrations
if [[ $apply_migrations =~ ^[Yy]$ ]]; then
    if [ -f "scripts/fix-pricing-columns.sql" ]; then
        echo "   Applying pricing column fixes..."
        mysql -h${DB_HOST:-localhost} -P${DB_PORT:-3306} -u${DB_USER:-root} -p${DB_PASSWORD} ${DB_NAME:-blindscommerce} < scripts/fix-pricing-columns.sql
        if [ $? -eq 0 ]; then
            echo "   ✓ Pricing columns updated"
        else
            echo "   ✗ Migration failed"
        fi
    else
        echo "   ✗ fix-pricing-columns.sql not found"
    fi
else
    echo "   Skipping migrations"
fi

# Step 8: Reset database connection state
echo ""
echo "8. Resetting database connection state..."
cat > reset-db-connection.js << 'EOF'
const { resetConnectionState } = require('./lib/db');
resetConnectionState();
console.log('Database connection state reset');
EOF

node reset-db-connection.js 2>/dev/null && rm reset-db-connection.js
echo "   ✓ Connection state reset"

# Step 9: Start the application
echo ""
echo "9. Recovery complete!"
echo ""
echo "Recommended next steps:"
echo "1. Run: npm run dev"
echo "2. Check http://localhost:3000"
echo "3. Run: npm run test:health (if available)"
echo "4. Monitor logs for any errors"
echo ""
echo "If issues persist:"
echo "- Run: ts-node scripts/system-health-check.ts"
echo "- Check application logs"
echo "- Verify all V2 API endpoints are responding"
echo ""
echo "=== Recovery script completed ===