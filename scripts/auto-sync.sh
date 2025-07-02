#!/bin/bash

# Auto-sync script for GitHub
# This script commits and pushes changes automatically

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Starting auto-sync...${NC}"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not a git repository${NC}"
    exit 1
fi

# Check for changes
if git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}📝 No changes to commit${NC}"
    exit 0
fi

# Add all changes
echo -e "${GREEN}📦 Adding changes...${NC}"
git add .

# Create commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MESSAGE="Auto-sync: ${TIMESTAMP}"

echo -e "${GREEN}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE"

# Push to remote
echo -e "${GREEN}🚀 Pushing to GitHub...${NC}"
if git push origin main 2>/dev/null || git push origin master 2>/dev/null; then
    echo -e "${GREEN}✅ Successfully synced with GitHub!${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Auto-sync completed!${NC}"