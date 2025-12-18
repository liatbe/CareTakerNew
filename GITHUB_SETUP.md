# GitHub Setup Instructions

Your code is now committed locally! Follow these steps to push to GitHub and deploy:

## Step 1: Create a GitHub Repository

1. Go to https://github.com
2. Sign in (or create an account if you don't have one)
3. Click the "+" icon in the top right → "New repository"
4. Repository name: `CareTakerNew` (or any name you prefer)
5. Description: "Self-service website for Israeli families to document and generate payslips for elder caretakers"
6. Choose **Public** (or Private if you prefer)
7. **DO NOT** initialize with README, .gitignore, or license (we already have these)
8. Click "Create repository"

## Step 2: Push Your Code to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
cd /Users/liatbe/Documents/cursorProjects/CareTakerNew

# Add the GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/CareTakerNew.git

# Push your code
git branch -M main
git push -u origin main
```

**Note:** You'll be prompted for your GitHub username and password (or personal access token).

## Step 3: Update Git Identity (Optional)

If you want to use a different email/name for commits:

```bash
git config --global user.email "your-actual-email@example.com"
git config --global user.name "Your Actual Name"
```

## Step 4: Deploy to Vercel

Once your code is on GitHub:

1. Go to https://vercel.com
2. Sign up/Login (use "Continue with GitHub")
3. Click "Add New Project"
4. Import your `CareTakerNew` repository
5. Vercel will auto-detect it's a Vite project
6. Click "Deploy"
7. Wait 1-2 minutes for deployment
8. Your site will be live at: `https://caretakernew.vercel.app` (or similar)

## Troubleshooting

### If you get authentication errors:
- Use a Personal Access Token instead of password:
  1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. Generate new token with `repo` permissions
  3. Use the token as your password when pushing

### If you need to change the remote URL:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/CareTakerNew.git
```

## Next Steps After Deployment

- Your site will be accessible to everyone via the Vercel URL
- You can add a custom domain in Vercel settings (free)
- Every time you push to GitHub, Vercel will automatically redeploy

