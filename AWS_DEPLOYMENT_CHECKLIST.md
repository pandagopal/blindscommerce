# 🚀 AWS Deployment Checklist for BlindsCommerce

Follow this step-by-step checklist to deploy your application to AWS.

## 📋 Pre-Deployment Checklist

- [ ] **Git Repository Ready**
  ```bash
  git add .
  git commit -m "Prepare for AWS deployment"
  git push origin main
  ```

- [ ] **Environment Variables Ready**
  - Copy `.env.production.template` to `.env.production`
  - Fill in all production values

- [ ] **Build Test Locally**
  ```bash
  npm run build
  npm start
  ```

## 🏗️ AWS Setup Steps

### Step 1: Create AWS Account
- [ ] Sign up for AWS account at https://aws.amazon.com
- [ ] Set up billing alerts
- [ ] Enable MFA for root account

### Step 2: Set Up RDS MySQL Database

1. [ ] **Go to RDS Console**
   - Services → RDS → Create database

2. [ ] **Configure Database**
   - Engine: MySQL 8.0
   - Template: Free tier (for testing) or Production
   - Instance: db.t3.micro (free tier)
   - Storage: 20GB SSD
   - Master username: `admin`
   - Master password: [Generate secure password]

3. [ ] **Network Settings**
   - VPC: Default
   - Public access: Yes (for initial setup)
   - Security group: Create new
   - Port: 3306

4. [ ] **Run Database Setup**
   ```bash
   ./scripts/setup-rds-database.sh
   ```

### Step 3: Deploy with AWS Amplify

1. [ ] **Go to Amplify Console**
   - Services → AWS Amplify → New app → Host web app

2. [ ] **Connect Repository**
   - Select: GitHub/GitLab/Bitbucket
   - Authorize AWS Amplify
   - Select repository: blindscommerce
   - Select branch: main

3. [ ] **Build Settings**
   - Framework: Next.js - SSR
   - Build spec: Use `amplify.yml` (auto-detected)

4. [ ] **Environment Variables**
   Add these in Amplify Console:
   ```
   DB_HOST=your-rds-endpoint.rds.amazonaws.com
   DB_PORT=3306
   DB_NAME=blindscommerce
   DB_USER=admin
   DB_PASSWORD=your-rds-password
   JWT_SECRET=your-64-char-secret
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=https://main.your-app-id.amplifyapp.com
   NODE_ENV=production
   ```

5. [ ] **Deploy**
   - Review settings
   - Click "Save and deploy"
   - Wait 10-15 minutes for deployment

### Step 4: Post-Deployment Configuration

1. [ ] **Update Security Groups**
   - RDS security group: Allow inbound from Amplify app
   - Remove public access from RDS after setup

2. [ ] **Configure Domain (Optional)**
   - Amplify Console → Domain management
   - Add custom domain
   - Configure DNS records

3. [ ] **Set Up SSL Certificate**
   - Automatically handled by Amplify
   - Or use AWS Certificate Manager for custom domains

4. [ ] **Enable Monitoring**
   - CloudWatch alarms for RDS
   - Amplify monitoring dashboard
   - Set up email alerts

## 🧪 Testing Checklist

- [ ] **Basic Functionality**
  - [ ] Homepage loads
  - [ ] Products page displays items
  - [ ] Filter functionality works
  - [ ] Product details page works

- [ ] **Authentication**
  - [ ] User registration
  - [ ] User login
  - [ ] Admin login
  - [ ] Password reset

- [ ] **Database**
  - [ ] Products load from RDS
  - [ ] Categories display correctly
  - [ ] Cart operations work

- [ ] **Performance**
  - [ ] Pages load under 3 seconds
  - [ ] Images optimize properly
  - [ ] No console errors

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check build logs in Amplify Console
   - Verify all dependencies in package.json
   - Check Node.js version compatibility

2. **Database Connection Fails**
   - Verify RDS endpoint in environment variables
   - Check security group rules
   - Ensure RDS is in same region

3. **Pages Not Loading**
   - Check Amplify deployment status
   - Verify environment variables
   - Check browser console for errors

## 📊 Cost Monitoring

- [ ] Set up AWS Budget alerts
- [ ] Monitor daily costs in AWS Console
- [ ] Review AWS Free Tier usage

## 🎉 Success Indicators

- [ ] ✅ Application accessible via Amplify URL
- [ ] ✅ All products display correctly
- [ ] ✅ Authentication works
- [ ] ✅ Database queries successful
- [ ] ✅ No errors in CloudWatch logs

## 📞 Need Help?

1. Check AWS Amplify documentation
2. Review CloudWatch logs
3. Check RDS performance insights
4. Contact AWS Support (if on paid plan)

---

**Deployment URL**: https://main.[your-app-id].amplifyapp.com

**Estimated Deployment Time**: 30-45 minutes

**Monthly Cost Estimate**: $20-35 (Amplify + RDS)