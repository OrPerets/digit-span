# Backend Configuration Guide

## Overview
This app can work in two modes:
1. **Local-only mode**: All data is stored locally in the browser (default for Netlify)
2. **Backend mode**: Data is sent to a MongoDB backend server

## Current Configuration

### Netlify Deployment (Local-only mode)
- No backend URL configured
- All data stored locally in browser
- No 404 errors for API calls
- Perfect for experiments without data collection requirements

### Local Development
- Backend URL: `http://localhost:3001`
- Requires running the Express.js server locally
- Data is saved to MongoDB

## Setting Up Backend Mode

### Option 1: Environment Variable (Recommended)
Set the `REACT_APP_API_URL` environment variable:

**For Netlify:**
1. Go to Site Settings > Environment Variables
2. Add: `REACT_APP_API_URL` = `https://your-backend-server.com`
3. Redeploy the site

**For Local Development:**
Create a `.env` file:
```
REACT_APP_API_URL=http://localhost:3001
```

### Option 2: Deploy Backend Server
Deploy your Express.js server to a platform like:
- Heroku
- Railway
- DigitalOcean
- AWS
- Vercel (with serverless functions)

Then set the `REACT_APP_API_URL` to your deployed backend URL.

## Backend Requirements

Your backend server needs these endpoints:

### 1. Sequence Management
```
GET /api/sequences/next
Response: { "sequence": "A" } or { "sequence": "B" }
```

### 2. Experiment Initialization
```
POST /api/experiments/init
Body: experiment data
Response: { "success": true, "experimentId": "..." }
```

### 3. Task Results
```
POST /api/tasks
Body: task result data
Response: { "success": true }
```

### 4. Experiment Completion
```
POST /api/experiments/complete
Body: final experiment data
Response: { "success": true }
```

## Data Flow

### Local-only Mode (Current Netlify Setup)
```
User → React App → Local Storage → Download JSON
```

### Backend Mode
```
User → React App → Backend API → MongoDB → Database
```

## Benefits of Each Mode

### Local-only Mode
- ✅ No server costs
- ✅ No database setup
- ✅ Works immediately
- ✅ No data privacy concerns
- ❌ Data lost if browser crashes
- ❌ No centralized data collection

### Backend Mode
- ✅ Centralized data collection
- ✅ Data persistence
- ✅ Real-time analytics
- ✅ Multiple participants
- ❌ Requires server setup
- ❌ Additional costs
- ❌ More complex deployment

## Current Status
Your Netlify deployment is working in **local-only mode**, which is perfect for:
- Testing the experiment
- Small-scale studies
- Prototyping
- When you don't need centralized data collection

The app will work perfectly without a backend - all data is saved locally and can be downloaded as JSON files. 