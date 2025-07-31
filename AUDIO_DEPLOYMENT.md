# Audio Files Deployment Guide

## Overview
This project uses audio files for background music, but they are not tracked in Git due to their large size. This guide explains how to handle audio files for deployment.

## Current Setup
- Audio files are stored in `public/dudu/` directory
- Files are named `1.wav`, `2.wav`, etc. (up to 22.wav)
- Audio files are **NOT** tracked in Git (to avoid repository size issues)
- A deployment script (`deploy-audio.js`) copies audio files during build

## For Local Development
1. Place your audio files in `public/dudu/` directory
2. Files should be named `1.wav`, `2.wav`, etc.
3. The application will work locally with these files

## For Vercel Deployment
The deployment process automatically handles audio files:

1. **During build**: The `deploy-audio.js` script copies audio files from `public/dudu/` to `build/dudu/`
2. **Deployment**: Vercel serves the files from the build directory

## For Netlify Deployment
Netlify deployment requires manual audio file upload since files are not tracked in Git:

### Option 1: Manual Upload (Recommended)
1. Deploy your app to Netlify (audio files will be missing initially)
2. In your Netlify dashboard, go to the "Deploys" tab
3. Click on your latest deploy
4. Go to "Functions" or "Files" tab
5. Upload the audio files from `public/dudu/` to the `build/dudu/` directory
6. Redeploy or trigger a new build

### Option 2: Use Netlify CLI
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Login: `netlify login`
3. Deploy with files: `netlify deploy --prod --dir=build`

### Option 3: Include in Git (Not Recommended for Large Files)
1. Remove `public/dudu/*.wav` from `.gitignore`
2. Add audio files to Git: `git add public/dudu/*.wav`
3. Commit and push: `git commit -m "Add audio files" && git push`
4. Netlify will automatically include them in the build

### Current Behavior
- The app will work without audio files (background music will be silent)
- Users will see console warnings about missing audio files
- The experiment functionality remains intact

## Manual Deployment Steps
If you need to deploy manually:

1. Ensure audio files are in `public/dudu/` directory
2. Run the build process: `npm run build`
3. The audio files will be copied to `build/dudu/`
4. Deploy the `build/` directory

## Troubleshooting

### Audio files not playing on Vercel
1. Check that audio files exist in `public/dudu/` locally
2. Verify the build process completed successfully
3. Check browser console for audio loading errors

### Build fails due to missing audio files
- The deployment script handles missing files gracefully
- If you don't have audio files, the app will still deploy (just without audio)

## Alternative Solutions

### Option 1: Use a CDN
Upload audio files to a CDN (like Cloudinary, AWS S3, or GitHub Releases) and update the audio URLs in `src/utils/audioUtils.js`.

### Option 2: Use GitHub Releases
1. Create a GitHub release with audio files
2. Download and extract during build process
3. Update deployment script accordingly

### Option 3: Include in Git (Not Recommended)
- Remove audio files from `.gitignore`
- Add them to Git (will increase repository size significantly)
- May cause push issues with large files

## File Structure
```
public/
  dudu/
    1.wav
    2.wav
    ...
    22.wav
```

## Audio File Requirements
- Format: WAV
- Naming: Sequential numbers (1.wav, 2.wav, etc.)
- Location: `public/dudu/` directory
- Quantity: Up to 22 files (as referenced in the code) 