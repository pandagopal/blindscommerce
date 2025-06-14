# AWS Deployment Guide for BlindsCommerce

## 🚀 Option 1: AWS Amplify (Recommended)

### Prerequisites
- AWS Account
- GitHub/GitLab repository
- MySQL database (RDS)

### Step 1: Prepare Environment Variables
Create a production `.env.production` file:

```bash
# Database (RDS MySQL)
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=3306
DB_NAME=blindscommerce
DB_USER=admin
DB_PASSWORD=your-secure-password

# JWT Configuration
JWT_SECRET=your-production-jwt-secret-here
SESSION_SECRET=your-production-session-secret

# Next.js Configuration
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Payment Providers (Production Keys)
STRIPE_SECRET_KEY=sk_live_your_live_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key

# Email Configuration
SMTP_HOST=email-smtp.region.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-access-key
SMTP_PASSWORD=your-ses-secret-key
SMTP_FROM_ADDRESS=noreply@yourdomain.com

NODE_ENV=production
```

### Step 2: Update package.json for Production
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "postbuild": "npm run db:migrate"
  }
}
```

### Step 3: AWS Amplify Deployment

1. **Login to AWS Console** → Search for "Amplify"

2. **Connect Repository**:
   - Click "New app" → "Host web app"
   - Connect your GitHub/GitLab repository
   - Select the main branch

3. **Configure Build Settings**:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

4. **Environment Variables**:
   - Go to App Settings → Environment variables
   - Add all your production environment variables

5. **Deploy**: Click "Save and deploy"

### Step 4: Set Up RDS MySQL Database

1. **Create RDS Instance**:
   ```bash
   # Go to RDS Console
   # Create database → MySQL
   # Choose appropriate instance size (t3.micro for testing)
   # Set master username/password
   # Configure VPC and security groups
   ```

2. **Security Group Configuration**:
   - Allow inbound traffic on port 3306
   - From your Amplify app's IP ranges

3. **Import Database Schema**:
   ```bash
   mysql -h your-rds-endpoint.region.rds.amazonaws.com -u admin -p blindscommerce < migrations/complete_blinds_schema.sql
   mysql -h your-rds-endpoint.region.rds.amazonaws.com -u admin -p blindscommerce < final_products_insert.sql
   ```

---

## 🚀 Option 2: EC2 + Load Balancer (More Control)

### Step 1: Launch EC2 Instance
```bash
# Choose Amazon Linux 2023
# Instance type: t3.medium or larger
# Configure security groups:
# - SSH (22) from your IP
# - HTTP (80) from anywhere
# - HTTPS (443) from anywhere
# - Custom (3000) from load balancer
```

### Step 2: Install Dependencies
```bash
# SSH into your EC2 instance
sudo yum update -y
sudo yum install -y nodejs npm git

# Install PM2 for process management
sudo npm install -g pm2

# Clone your repository
git clone https://github.com/yourusername/blindscommerce.git
cd blindscommerce

# Install dependencies
npm install

# Build the application
npm run build
```

### Step 3: Configure PM2
```bash
# Create ecosystem.config.js
module.exports = {
  apps: [{
    name: 'blindscommerce',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 4: Set Up Application Load Balancer
```bash
# Go to EC2 Console → Load Balancers
# Create Application Load Balancer
# Configure listeners:
# - HTTP (80) → Redirect to HTTPS
# - HTTPS (443) → Forward to EC2 instances on port 3000
# Add SSL certificate from ACM
```

---

## 🚀 Option 3: Serverless with Vercel (Alternative)

### Quick Deployment to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DB_HOST production
vercel env add DB_PASSWORD production
# ... add all other env vars

# Deploy to production
vercel --prod
```

---

## 📊 Cost Comparison (Monthly estimates)

### AWS Amplify
- **Amplify hosting**: $0.01/GB + $0.15/build minute
- **RDS t3.micro**: ~$15-20/month
- **Total**: ~$20-30/month

### EC2 + RDS
- **EC2 t3.medium**: ~$30/month
- **RDS t3.micro**: ~$15-20/month
- **Load Balancer**: ~$20/month
- **Total**: ~$65-70/month

### Vercel + AWS RDS
- **Vercel Pro**: $20/month
- **RDS t3.micro**: ~$15-20/month
- **Total**: ~$35-40/month

---

## 🔒 Security Checklist

### SSL/TLS Configuration
- Use AWS Certificate Manager for free SSL certificates
- Enable HTTPS redirect
- Configure security headers

### Database Security
- Use RDS with encryption at rest
- Configure VPC and security groups properly
- Use strong passwords and rotate them regularly

### Environment Variables
- Never commit production secrets
- Use AWS Systems Manager Parameter Store for sensitive data
- Rotate API keys regularly

### Monitoring
- Set up CloudWatch alarms
- Monitor application logs
- Configure backup strategies

---

## 🚀 Recommended Deployment Flow

1. **Start with AWS Amplify** for simplicity
2. **Set up RDS MySQL** database
3. **Configure domain and SSL**
4. **Set up monitoring and backups**
5. **Scale to EC2 if needed** for more control

Would you like me to help you with any specific part of this deployment process?