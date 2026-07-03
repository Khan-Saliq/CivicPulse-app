#!/bin/bash

echo "🚀 CivicPulse Deployment Preparation"
echo "===================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to Git..."
git add .

# Commit
echo "💾 Creating commit..."
git commit -m "Prepare for deployment to Vercel + Render"

echo ""
echo "✅ Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Create a GitHub repository"
echo "2. Run: git remote add origin YOUR_GITHUB_URL"
echo "3. Run: git push -u origin main"
echo "4. Follow DEPLOYMENT_GUIDE.md"
echo ""
echo "📖 Check DEPLOYMENT_GUIDE.md for detailed instructions"
