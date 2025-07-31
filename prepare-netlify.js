const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing build for Netlify deployment...');

// First, run the normal build
const { execSync } = require('child_process');

try {
  console.log('📦 Running React build...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ React build completed successfully');
} catch (error) {
  console.error('❌ React build failed:', error.message);
  process.exit(1);
}

// Then copy audio files
const sourceDir = path.join(__dirname, 'public', 'dudu');
const buildDir = path.join(__dirname, 'build', 'dudu');

console.log('🎵 Checking for audio files...');

if (!fs.existsSync(sourceDir)) {
  console.log('⚠️  Source audio directory not found:', sourceDir);
  console.log('💡 Audio files will be missing in deployment');
  console.log('📖 See AUDIO_DEPLOYMENT.md for instructions on adding audio files');
  process.exit(0);
}

// Create build directory if it doesn't exist
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('📁 Created build audio directory:', buildDir);
}

// Copy audio files
try {
  const files = fs.readdirSync(sourceDir);
  const wavFiles = files.filter(file => file.endsWith('.wav'));
  
  if (wavFiles.length === 0) {
    console.log('⚠️  No .wav files found in source directory');
    console.log('💡 Audio files will be missing in deployment');
    process.exit(0);
  }
  
  console.log(`🎵 Found ${wavFiles.length} audio files`);
  
  wavFiles.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(buildDir, file);
    
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied: ${file}`);
  });
  
  console.log('🎵 Audio files copied successfully!');
  console.log('🚀 Build directory is ready for Netlify deployment');
  console.log('📖 To deploy:');
  console.log('   1. Run: netlify deploy --prod --dir=build');
  console.log('   2. Or upload the build/ directory to Netlify dashboard');
  
} catch (error) {
  console.error('❌ Error copying audio files:', error.message);
  process.exit(1);
} 