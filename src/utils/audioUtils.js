export const playBackgroundMusic = () => {
  console.log('🎵 AudioUtils: playBackgroundMusic called');
  
  // Stop any existing audio first
  const existingAudio = document.querySelector('audio[data-background-music]');
  if (existingAudio) {
    console.log('🎵 AudioUtils: Found existing audio, stopping it');
    existingAudio.pause();
    existingAudio.currentTime = 0;
    existingAudio.remove();
  }

  const randomTrack = Math.floor(Math.random() * 22) + 1;
  console.log(`🎵 AudioUtils: Selected track ${randomTrack}`);
  
  const audio = new Audio(`/dudu/${randomTrack}.wav`);
  audio.setAttribute('data-background-music', 'true'); // Add attribute to identify background music
  audio.loop = true;
  audio.volume = 0.5; // Set volume to 50%
  
  console.log('🎵 AudioUtils: Audio element created:', {
    src: audio.src,
    volume: audio.volume,
    loop: audio.loop,
    paused: audio.paused
  });
  
  // Append to DOM so volume monitor can find it
  audio.style.display = 'none'; // Hide the audio element
  document.body.appendChild(audio);
  console.log('🎵 AudioUtils: Audio element appended to DOM');
  
  // Create a promise to handle the play request
  const playPromise = audio.play();
  
  // Handle the promise properly
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        // Audio started playing successfully
        console.log('🎵 AudioUtils: ✅ Background music started playing successfully');
        console.log('🎵 AudioUtils: Audio state after play:', {
          paused: audio.paused,
          currentTime: audio.currentTime,
          duration: audio.duration,
          volume: audio.volume
        });
      })
      .catch(error => {
        // Handle any errors that occur during playback
        if (error.name === 'AbortError') {
          console.log('🎵 AudioUtils: Playback was aborted, this is expected during rapid phase changes');
        } else if (error.name === 'NotSupportedError' || error.message.includes('404')) {
          console.warn('🎵 AudioUtils: Audio file not found or not supported. Audio files may not be deployed.');
          console.warn('🎵 AudioUtils: Please ensure audio files are in public/dudu/ directory for local development.');
          console.warn('🎵 AudioUtils: For deployment, follow the instructions in AUDIO_DEPLOYMENT.md');
        } else {
          console.error('🎵 AudioUtils: ❌ Error playing background music:', error);
        }
      });
  }
  
  console.log('🎵 AudioUtils: Returning audio element');
  return audio;
};

export const stopBackgroundMusic = (audio) => {
  if (audio) {
    // Create a promise to handle the pause request
    const pausePromise = audio.pause();
    
    if (pausePromise !== undefined) {
      pausePromise
        .then(() => {
          // Audio paused successfully
          audio.currentTime = 0;
          // Remove from DOM
          if (audio.parentNode) {
            audio.parentNode.removeChild(audio);
          }
        })
        .catch(error => {
          console.error('Error pausing background music:', error);
          // Still try to remove from DOM even if pause fails
          if (audio.parentNode) {
            audio.parentNode.removeChild(audio);
          }
        });
    } else {
      // If no promise is returned, pause is synchronous
      audio.currentTime = 0;
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
    }
  }
}; 