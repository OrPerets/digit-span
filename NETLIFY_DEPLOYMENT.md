# Netlify Deployment Guide

## Overview
This guide explains how to deploy the digit-span experiment to Netlify, including handling the audio files that are not tracked in Git.

## Quick Deployment (Without Audio Files)

### Option 1: Automatic Deployment from Git
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Deploy - the app will work without background music

### Option 2: Manual Deployment
1. Run locally: `npm run build`
2. Upload the `build/` folder to Netlify dashboard
3. The app will work without background music

## Full Deployment (With Audio Files)

### Prerequisites
- Netlify CLI installed: `npm install -g netlify-cli`
- Audio files in `public/dudu/` directory

### Step 1: Prepare Build with Audio Files
```bash
# Run the preparation script
npm run build:netlify
```

This script will:
- Build the React app
- Copy audio files to the build directory
- Prepare everything for deployment

### Step 2: Deploy to Netlify
```bash
# Login to Netlify (first time only)
netlify login

# Deploy with audio files
npm run deploy:netlify
```

### Alternative: Manual Upload
1. Run `npm run build:netlify` locally
2. Go to Netlify dashboard
3. Upload the entire `build/` directory
4. The audio files will be included

## Configuration Files

### netlify.toml
This file configures the Netlify deployment:
- Build command and publish directory
- Node.js version
- Audio file caching headers
- Fallback for missing audio files

### Audio File Handling
- Audio files are served from `/dudu/` path
- Missing files show a placeholder page
- Console warnings inform about missing audio
- App continues to function without audio

## Troubleshooting

### Audio Files Not Playing
1. Check browser console for 404 errors
2. Verify audio files are in `build/dudu/` directory
3. Check Netlify file upload was successful
4. Clear browser cache and reload

### Build Failures
1. Ensure Node.js version 18+ is used
2. Check all dependencies are installed
3. Verify build command in Netlify settings

### Large File Upload Issues
1. Audio files are ~30MB each
2. Use Netlify CLI for reliable uploads
3. Consider using a CDN for audio files
4. Split large files if needed

## Development vs Production

### Local Development
- Audio files work automatically from `public/dudu/`
- No special configuration needed
- Files are served by React dev server

### Production (Netlify)
- Audio files must be manually included in build
- Files are served from `build/dudu/` directory
- Missing files show graceful fallback

## File Structure After Deployment
```
build/
├── static/
├── dudu/
│   ├── 1.wav
│   ├── 2.wav
│   ├── 3.wav
│   ├── 4.wav
│   └── 5.wav
├── index.html
└── ...
```

## Environment Variables
If you need to set environment variables in Netlify:
1. Go to Site Settings > Environment Variables
2. Add any required variables
3. Redeploy the site

### Backend Configuration
To connect to a MongoDB backend server:
1. Set `REACT_APP_API_URL` to your backend server URL
2. Example: `https://your-backend-server.herokuapp.com`
3. See `BACKEND_CONFIGURATION.md` for detailed instructions

**Note**: The app works perfectly without a backend in local-only mode.

## Performance Optimization
- Audio files are cached for 1 year
- Static assets are optimized during build
- Consider using WebM format for smaller file sizes
- Implement lazy loading for audio files

## Support
For issues with audio file deployment:
1. Check AUDIO_DEPLOYMENT.md for detailed instructions
2. Verify file paths and permissions
3. Test locally before deploying
4. Use browser dev tools to debug audio loading 