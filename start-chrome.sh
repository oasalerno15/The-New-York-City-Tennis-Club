#!/bin/bash

# Kill any existing Next.js processes
pkill -f "next dev" || true

# Wait a moment
sleep 1

# Start Next.js in background
npm run dev &

# Wait for server to start
sleep 5

# Force open Chrome (even if Safari is default)
open -a "Google Chrome" http://localhost:3000

# Also set Chrome as default for this session
export BROWSER="open -a 'Google Chrome'"

# Wait and bring the process to foreground
wait
