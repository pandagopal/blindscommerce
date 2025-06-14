#!/bin/bash

# AWS RDS Database Setup Script
# This script helps you set up your database on AWS RDS

echo "========================================="
echo "BlindsCommerce RDS Database Setup"
echo "========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
        exit 1
    fi
}

# Get database credentials
echo -e "\n${YELLOW}Enter your RDS database details:${NC}"
read -p "RDS Endpoint (e.g., mydb.abc123.us-east-1.rds.amazonaws.com): " DB_HOST
read -p "Database Name (default: blindscommerce): " DB_NAME
DB_NAME=${DB_NAME:-blindscommerce}
read -p "Database User (default: admin): " DB_USER
DB_USER=${DB_USER:-admin}
read -sp "Database Password: " DB_PASSWORD
echo ""

# Test connection
echo -e "\n${YELLOW}Testing database connection...${NC}"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" > /dev/null 2>&1
check_status "Database connection successful"

# Create database if it doesn't exist
echo -e "\n${YELLOW}Creating database if not exists...${NC}"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
check_status "Database created/verified"

# Import schema
echo -e "\n${YELLOW}Importing database schema...${NC}"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < migrations/complete_blinds_schema.sql
check_status "Schema imported successfully"

# Import initial data
echo -e "\n${YELLOW}Importing product data...${NC}"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < final_products_insert.sql
check_status "Product data imported successfully"

# Verify data
echo -e "\n${YELLOW}Verifying database setup...${NC}"
PRODUCT_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM products;")
echo -e "${GREEN}✓ Found $PRODUCT_COUNT products in database${NC}"

CATEGORY_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM categories;")
echo -e "${GREEN}✓ Found $CATEGORY_COUNT categories in database${NC}"

# Create admin user
echo -e "\n${YELLOW}Would you like to create an admin user? (y/n)${NC}"
read -n 1 CREATE_ADMIN
echo ""

if [[ $CREATE_ADMIN =~ ^[Yy]$ ]]; then
    read -p "Admin Email: " ADMIN_EMAIL
    read -sp "Admin Password: " ADMIN_PASSWORD
    echo ""
    
    # Hash password using Node.js
    HASHED_PASSWORD=$(node -e "
    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('$ADMIN_PASSWORD', salt);
    console.log(hash);
    ")
    
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
    INSERT INTO users (email, password, role, status, created_at, updated_at) 
    VALUES ('$ADMIN_EMAIL', '$HASHED_PASSWORD', 'admin', 'active', NOW(), NOW())
    ON DUPLICATE KEY UPDATE password='$HASHED_PASSWORD', updated_at=NOW();"
    
    check_status "Admin user created/updated"
fi

# Save connection details for reference
echo -e "\n${YELLOW}Saving connection details...${NC}"
cat > .rds-connection.txt << EOF
RDS Connection Details (Keep this secure!)
==========================================
Host: $DB_HOST
Database: $DB_NAME
User: $DB_USER
Port: 3306

Add these to your Amplify environment variables:
DB_HOST=$DB_HOST
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=<your-password>
EOF

echo -e "${GREEN}✓ Connection details saved to .rds-connection.txt${NC}"
echo -e "\n${GREEN}✅ Database setup complete!${NC}"
echo -e "${YELLOW}Remember to add these connection details to your AWS Amplify environment variables.${NC}"

# Add to .gitignore
if ! grep -q ".rds-connection.txt" .gitignore; then
    echo ".rds-connection.txt" >> .gitignore
    echo -e "${GREEN}✓ Added .rds-connection.txt to .gitignore${NC}"
fi