# Audio Files Directory

This directory should contain your audio files for background music.

## Required Files
- `1.wav` through `22.wav` (22 audio files total)
- All files should be in WAV format
- Files should be named sequentially: `1.wav`, `2.wav`, `3.wav`, etc.

## How to Add Audio Files
1. Place your WAV audio files in this directory
2. Name them `1.wav`, `2.wav`, `3.wav`, etc. (up to `22.wav`)
3. The application will automatically use these files for background music

## For Deployment
- Audio files are NOT tracked in Git (to avoid repository size issues)
- The deployment script (`deploy-audio.js`) will copy these files during build
- Make sure to add your audio files before deploying to Vercel

## Current Status
⚠️ **No audio files found** - Please add your audio files to enable background music functionality.

## File Structure Example
```
public/dudu/
├── 1.wav
├── 2.wav
├── 3.wav
├── ...
└── 22.wav
``` 