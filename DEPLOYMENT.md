# Deployment Guide - CareTaker Self Service

This guide will help you deploy the CareTaker Self Service application to Vercel (free hosting).

## Prerequisites

1. A GitHub account (free)
2. A Vercel account (free)

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy the application**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No**
   - Project name? (Press Enter for default or enter a custom name)
   - Directory? (Press Enter for current directory)
   - Override settings? **No**

4. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub + Vercel Dashboard (Easier)

1. **Push to GitHub**:
   ```bash
   # Create a new repository on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy via Vercel Dashboard**:
   - Go to https://vercel.com
   - Sign up/Login with your GitHub account
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings
   - Click "Deploy"
   - Your site will be live in minutes!

### Option 3: Deploy via Netlify (Alternative)

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

## Important Notes

- **Data Storage**: This application uses localStorage, which means data is stored in each user's browser. Each family's data is isolated based on their login credentials.

- **No Backend Required**: Since we're using localStorage, no database or backend server is needed.

- **HTTPS**: Vercel automatically provides HTTPS for your site.

- **Custom Domain**: You can add a custom domain in Vercel settings (free tier supports custom domains).

## Environment Variables

Currently, no environment variables are needed. All configuration is done through the application settings.

## Updating the Deployment

After making changes:

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Your update message"
   ```

2. **Push to GitHub** (if using GitHub):
   ```bash
   git push
   ```
   Vercel will automatically redeploy.

3. **Or redeploy via CLI**:
   ```bash
   vercel --prod
   ```

## Troubleshooting

- If the site shows a blank page, check the browser console for errors
- Make sure all routes are properly configured (we use React Router)
- The `vercel.json` file handles routing for single-page applications

## Support

For issues with deployment, check:
- Vercel Documentation: https://vercel.com/docs
- Vite Deployment Guide: https://vitejs.dev/guide/static-deploy.html

