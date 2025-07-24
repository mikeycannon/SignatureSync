#!/bin/bash

# Script to sync current local version to Git repository
# This will overwrite the Git version with the current local version

echo "🔄 Syncing current local version to Git repository..."
echo "⚠️  This will overwrite the Git version with the current local version."
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ No Git repository found. Please initialize Git first:"
    echo "   git init"
    echo "   git remote add origin <your-repo-url>"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

echo "Current branch: $CURRENT_BRANCH"
echo ""

# Ask for confirmation
read -p "Are you sure you want to overwrite the Git repository? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Sync cancelled."
    exit 1
fi

echo "🔄 Starting sync process..."

# Add all files
git add .

# Create commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
git commit -m "Sync local version to Git - $TIMESTAMP

✓ Template saving functionality fixed
✓ SVG upload support added
✓ Logo spacing controls implemented
✓ Mobile navigation improvements
✓ Authentication fixes for asset uploads"

# Force push to overwrite remote
echo "🚀 Pushing to remote repository..."
git push --force-with-lease origin $CURRENT_BRANCH

if [ $? -eq 0 ]; then
    echo "✅ Successfully synced local version to Git repository!"
    echo "🎉 Your Git repository now matches your local version."
else
    echo "❌ Failed to push to remote repository."
    echo "Please check your Git remote configuration and try again."
    exit 1
fi

echo ""
echo "📋 Summary of changes synced:"
echo "- Fixed template saving validation issues"
echo "- Added SVG file upload support"
echo "- Implemented logo spacing controls (0-50px)"
echo "- Fixed mobile navigation across all pages"
echo "- Resolved authentication headers for asset uploads"
echo ""
echo "🔗 Your Git repository is now up to date!"