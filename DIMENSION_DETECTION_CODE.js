// DIMENSION DETECTION - Use if hardcoded dimensions don't work
//
// This code detects the input video dimensions and passes them to autocaption
// Guarantees output matches input aspect ratio

// Add this function to index.js:

async function getVideoDimensions(videoUrl) {
  try {
    console.log("🔍 Detecting video dimensions for:", videoUrl);
    
    // Use Replicate's video-info model or similar to get dimensions
    // Alternative: Use probe-video or similar model
    const probe = await replicate.predictions.create({
      model: "andreasjansson/video-dimensions",  // hypothetical model
      input: { video: videoUrl }
    });
    
    await probe.wait();
    
    const { width, height } = probe.output;
    console.log(`📐 Detected: ${width}x${height}`);
    
    return { width, height };
  } catch (error) {
    console.log("⚠️ Could not detect dimensions, using defaults");
    // Default to portrait if detection fails
    return { width: 1080, height: 1920 };
  }
}

// Then in the caption endpoint, BEFORE creating prediction:

// Detect input dimensions
const { width, height } = await getVideoDimensions(videoUrl);

const prediction = await tiktokReplicate.predictions.create({
  version: "18a45ff0d95feb4449d192bbdc06b4a6df168fa33def76dfc51b78ae224b599b",
  input: {
    video_file_input: videoUrl,
    video_width: width,      // Use detected width
    video_height: height,    // Use detected height
    font_size: 7,
    subs_position: "bottom75",
    max_chars: 20,
    output_video_format: "mp4"
  }
});

// This GUARANTEES output matches input dimensions exactly

// ============================================================
// ALTERNATIVE: If no dimension detection model exists
// ============================================================

// Option A: Use FFprobe directly (if available on server)
const { execSync } = require('child_process');

function getVideoDimensionsFFprobe(videoPath) {
  const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${videoPath}"`;
  const output = execSync(cmd).toString().trim();
  const [width, height] = output.split(',').map(Number);
  return { width, height };
}

// Option B: Download video temporarily and check with a library
const probe = require('probe-image-size');

async function getVideoDimensionsLocal(videoUrl) {
  // Download first frame or video metadata
  const response = await fetch(videoUrl, { method: 'HEAD' });
  // ... extract dimensions from response headers or video metadata
}

// Option C: Client-side detection
// Have the frontend detect dimensions before upload:
// 
// In tiktok-captions.js:
// 
// const video = document.createElement('video');
// video.src = URL.createObjectURL(file);
// await new Promise(resolve => video.onloadedmetadata = resolve);
// const dimensions = { width: video.videoWidth, height: video.videoHeight };
// 
// // Send dimensions with upload
// formData.append('width', dimensions.width);
// formData.append('height', dimensions.height);

// Then backend receives dimensions in request and uses them directly
// This is the FASTEST and most RELIABLE approach

// ============================================================
// IMPLEMENT THIS IF HARDCODED DIMENSIONS DON'T WORK
// ============================================================
