# Push to GitHub - Quick Guide

Your git is configured and ready! Follow these steps:

## Step 1: Create the GitHub Repository

1. Go to https://github.com/liatbe
2. Click the "+" icon in top right → "New repository"
3. Repository name: `CareTakerNew`
4. Description: "Self-service website for Israeli families to document and generate payslips for elder caretakers"
5. Choose **Public** (or Private if you prefer)
6. **IMPORTANT:** Do NOT check "Initialize with README", "Add .gitignore", or "Choose a license"
7. Click "Create repository"

## Step 2: Push Your Code

After creating the repository, run this command:

```bash
cd /Users/liatbe/Documents/cursorProjects/CareTakerNew
git push -u origin main
```

You'll be prompted for:
- **Username:** liatbe
- **Password:** Use a Personal Access Token (not your GitHub password)

### How to Create a Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "CareTaker Deployment"
4. Select scopes: Check `repo` (this gives full repository access)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

## Step 3: Deploy to Vercel

Once your code is pushed to GitHub:

1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel to access your GitHub
4. Click "Add New Project"
5. Find and select `CareTakerNew` repository
6. Vercel will auto-detect Vite settings
7. Click "Deploy"
8. Wait 1-2 minutes
9. Your site will be live! 🎉

## Your Site URL

After deployment, your site will be available at:
- `https://caretakernew.vercel.app` (or similar)
- You can also add a custom domain in Vercel settings

## Troubleshooting

### If push fails with authentication error:
- Make sure you're using a Personal Access Token, not your GitHub password
- Tokens need `repo` scope

### If repository doesn't exist:
- Make sure you created it on GitHub first (Step 1)

### If you need to update the remote URL:
```bash
git remote set-url origin https://github.com/liatbe/CareTakerNew.git
```

