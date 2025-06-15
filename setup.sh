#!/bin/bash

echo "🎮 Cixu Game Setup"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install npm."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check for database environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not found in environment"
    echo "   If running locally, make sure to set up PostgreSQL and environment variables"
    echo "   If running on Replit, the database should be automatically configured"
else
    echo "✅ Database URL found"
    
    # Try to push database schema
    echo "🗄️  Setting up database schema..."
    npm run db:push
    
    if [ $? -eq 0 ]; then
        echo "✅ Database schema created successfully"
    else
        echo "⚠️  Database schema setup had issues, but continuing..."
    fi
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "The game will be available at:"
echo "  http://localhost:5000"
echo ""
echo "Game Features:"
echo "  • Real-time multiplayer with WebSocket"
echo "  • Theme-based or custom prompts"
echo "  • Drag & drop positioning interface"
echo "  • Collaborative gameplay rounds"
echo "  • Accuracy scoring and results"
echo ""
echo "For detailed instructions, see README.md"
