#!/bin/bash
# System Cleanup Script
# Safely cleans caches and temporary files to free up disk space

set -e

echo "🧹 Starting system cleanup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to get size before cleanup
get_size() {
    du -sh "$1" 2>/dev/null | awk '{print $1}' || echo "0"
}

# 1. Clean Homebrew cache
echo -e "${YELLOW}1. Cleaning Homebrew cache...${NC}"
BREW_SIZE_BEFORE=$(get_size ~/Library/Caches/Homebrew)
brew cleanup --prune=all 2>/dev/null || echo "  ⚠️  Homebrew cleanup skipped (not available)"
BREW_SIZE_AFTER=$(get_size ~/Library/Caches/Homebrew)
echo "  ✅ Homebrew cache: $BREW_SIZE_BEFORE → $BREW_SIZE_AFTER"
echo ""

# 2. Clean npm cache
echo -e "${YELLOW}2. Cleaning npm cache...${NC}"
NPM_SIZE_BEFORE=$(du -sh ~/.npm 2>/dev/null | awk '{print $1}' || echo "0")
npm cache clean --force 2>/dev/null || echo "  ⚠️  npm cache cleanup skipped"
NPM_SIZE_AFTER=$(du -sh ~/.npm 2>/dev/null | awk '{print $1}' || echo "0")
echo "  ✅ npm cache: $NPM_SIZE_BEFORE → $NPM_SIZE_AFTER"
echo ""

# 3. Clean pip cache
echo -e "${YELLOW}3. Cleaning pip cache...${NC}"
PIP_SIZE_BEFORE=$(get_size ~/Library/Caches/pip)
pip cache purge 2>/dev/null || echo "  ⚠️  pip cache cleanup skipped"
PIP_SIZE_AFTER=$(get_size ~/Library/Caches/pip)
echo "  ✅ pip cache: $PIP_SIZE_BEFORE → $PIP_SIZE_AFTER"
echo ""

# 4. Clean pypoetry cache (if exists)
echo -e "${YELLOW}4. Cleaning pypoetry cache...${NC}"
if [ -d ~/Library/Caches/pypoetry ]; then
    PYPOETRY_SIZE_BEFORE=$(get_size ~/Library/Caches/pypoetry)
    # Clean pypoetry cache (be careful - this removes downloaded packages)
    rm -rf ~/Library/Caches/pypoetry/cache/* 2>/dev/null || true
    PYPOETRY_SIZE_AFTER=$(get_size ~/Library/Caches/pypoetry)
    echo "  ✅ pypoetry cache: $PYPOETRY_SIZE_BEFORE → $PYPOETRY_SIZE_AFTER"
else
    echo "  ℹ️  pypoetry cache not found"
fi
echo ""

# 5. Clean node-gyp cache
echo -e "${YELLOW}5. Cleaning node-gyp cache...${NC}"
NODE_GYP_SIZE_BEFORE=$(get_size ~/Library/Caches/node-gyp)
rm -rf ~/Library/Caches/node-gyp/* 2>/dev/null || true
NODE_GYP_SIZE_AFTER=$(get_size ~/Library/Caches/node-gyp)
echo "  ✅ node-gyp cache: $NODE_GYP_SIZE_BEFORE → $NODE_GYP_SIZE_AFTER"
echo ""

# 6. Empty Trash (optional - commented out for safety)
echo -e "${YELLOW}6. Trash status...${NC}"
TRASH_SIZE=$(get_size ~/.Trash)
echo "  ℹ️  Trash size: $TRASH_SIZE"
echo "  💡 To empty trash, run: rm -rf ~/.Trash/*"
echo ""

# 7. Show disk space summary
echo -e "${GREEN}📊 Disk Space Summary:${NC}"
df -h / | tail -1 | awk '{print "  Total: " $2 " | Used: " $3 " | Available: " $4 " | Usage: " $5}'
echo ""

# 8. Show largest cache directories
echo -e "${GREEN}📁 Largest Cache Directories:${NC}"
du -sh ~/Library/Caches/* 2>/dev/null | sort -hr | head -5 | awk '{print "  " $2 ": " $1}'
echo ""

echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "💡 Additional cleanup options:"
echo "   - Review ~/Downloads (currently ~19GB)"
echo "   - Review ~/Library/Caches/Google (currently ~7.7GB)"
echo "   - Empty Trash if needed"
echo ""








