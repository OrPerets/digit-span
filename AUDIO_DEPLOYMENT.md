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