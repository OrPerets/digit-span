const fs = require('fs');
const path = require('path');

// Function to copy audio files for deployment
function copyAudioFiles() {
  const sourceDir = path.join(__dirname, 'public', 'dudu');
  const buildDir = path.join(__dirname, 'build', 'dudu');
  
  console.log('🎵 Checking for audio files...');
  
  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.log('⚠️  Source audio directory not found:', sourceDir);
    return;
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
      return;
    }
    
    console.log(`🎵 Found ${wavFiles.length} audio files`);
    
    wavFiles.forEach(file => {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(buildDir, file);
      
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied: ${file}`);
    });
    
    console.log('🎵 Audio files copied successfully for deployment!');
  } catch (error) {
    console.error('❌ Error copying audio files:', error.message);
  }
}

// Run the function
copyAudioFiles(); 