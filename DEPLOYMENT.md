# Deployment Guide

## Build Status

✅ **Build Successful** - The application has been built and is ready for deployment.

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

Vercel is the recommended platform for Next.js applications as it's created by the same team.

#### Prerequisites
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your code in a Git repository (GitHub, GitLab, or Bitbucket)

#### Steps:

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Bitmask Username Update app"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy via Vercel Dashboard**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Vercel will auto-detect Next.js settings
   - Add environment variables:
     - `NEXT_PUBLIC_INSTANT_APP_ID` = `e183332d-f1ca-469a-a705-d24f4f39eb12`
     - `INSTANT_ADMIN_TOKEN` = (optional, for production)
   - Click "Deploy"

3. **Deploy via Vercel CLI** (Alternative)
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```
   Follow the prompts and add environment variables when asked.

#### Post-Deployment
- Your app will be available at `https://your-app-name.vercel.app`
- Vercel automatically provides HTTPS
- Automatic deployments on every push to main branch

### Option 2: Netlify

#### Steps:

1. **Push to Git Repository** (same as above)

2. **Deploy via Netlify Dashboard**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Add environment variables in Site settings → Environment variables
   - Deploy

### Option 3: Self-Hosted (Node.js Server)

#### Steps:

1. **Prepare Server**
   - Ensure Node.js 18+ is installed
   - Install PM2 for process management: `npm install -g pm2`

2. **Transfer Files**
   ```bash
   # On your server
   git clone <your-repo-url>
   cd "Bitmask Username Update"
   ```

3. **Set Environment Variables**
   ```bash
   # Create .env.production
   echo "NEXT_PUBLIC_INSTANT_APP_ID=e183332d-f1ca-469a-a705-d24f4f39eb12" > .env.production
   echo "INSTANT_ADMIN_TOKEN=your-admin-token" >> .env.production
   ```

4. **Build and Start**
   ```bash
   npm install
   npm run build
   pm2 start npm --name "bitmask-app" -- start
   pm2 save
   pm2 startup
   ```

5. **Configure Reverse Proxy** (Nginx example)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Environment Variables for Production

Make sure to set these in your hosting platform:

### Required:
- `NEXT_PUBLIC_INSTANT_APP_ID` = `e183332d-f1ca-469a-a705-d24f4f39eb12`

### Optional (Recommended for Production):
- `INSTANT_ADMIN_TOKEN` = Your InstantDB admin token for enhanced security

## Pre-Deployment Checklist

- [x] Application builds successfully (`npm run build`)
- [ ] InstantDB schema is configured in dashboard
- [ ] Email delivery is configured in InstantDB for magic codes
- [ ] Environment variables are set in hosting platform
- [ ] Git repository is set up (if using Git-based deployment)
- [ ] Domain is configured (if using custom domain)

## Post-Deployment Steps

1. **Verify Deployment**
   - Visit your deployed URL
   - Test the home page loads
   - Test admin login flow
   - Test user update flow

2. **Configure InstantDB**
   - Ensure schema matches the application
   - Verify email delivery settings
   - Test magic code authentication

3. **Monitor**
   - Check application logs
   - Monitor InstantDB dashboard for data
   - Set up error tracking (optional)

## Troubleshooting Deployment

### Build Fails on Deployment Platform

- Check that Node.js version matches (18+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors
- Ensure environment variables are set

### App Works Locally but Not in Production

- Verify environment variables are set correctly
- Check InstantDB App ID is correct
- Verify InstantDB schema is configured
- Check browser console for errors
- Review server logs

### Magic Code Authentication Not Working

- Verify email delivery is configured in InstantDB
- Check spam folder for magic codes
- Verify InstantDB App ID is correct
- Check InstantDB dashboard for service status

## Quick Deploy Commands

### Vercel (CLI)
```bash
vercel --prod
```

### Netlify (CLI)
```bash
netlify deploy --prod
```

### Manual Build
```bash
npm run build
npm start
```

## Support

For deployment issues:
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Netlify**: [docs.netlify.com](https://docs.netlify.com)
- **InstantDB**: [instantdb.com/docs](https://www.instantdb.com/docs)

