# Location Tracker

A real-time location tracking application that allows you to generate shareable links to track someone's live location.

## Features

- 🎯 Generate unique tracking links
- 📍 Real-time location tracking
- 🗺️ Google Maps integration
- 📱 Mobile-friendly interface
- 🔒 Secure link-based tracking
- 🎨 Beautiful New Year 2026 themed media files

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

2. **Set up environment variables:**
   - Copy `server/env.example` to `server/.env`
   - Copy `client/env.example` to `client/.env`

3. **Start the backend:**
   ```bash
   npm start
   ```

4. **Start the frontend (in a new terminal):**
   ```bash
   cd client && npm start
   ```

5. **Open http://localhost:3000** in your browser

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to free hosting services.

### Quick Deploy

1. **Backend (Render):**
   - Push to GitHub
   - Connect to Render
   - Set environment variables
   - Deploy

2. **Frontend (Netlify):**
   - Connect GitHub repo
   - Set build directory: `client`
   - Set environment variable: `REACT_APP_API_URL`
   - Deploy

## Project Structure

```
LocationTracker/
├── server/           # Backend API (Express.js)
│   ├── index.js      # Main server file
│   └── test.js      # Unit tests
├── client/          # Frontend (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.js
│   │   │   ├── ViewLocations.js
│   │   │   └── TrackLink.js
│   │   └── App.js
│   └── public/
└── package.json
```

## API Endpoints

- `POST /api/links/generate` - Generate a new tracking link
- `GET /api/links/:linkId` - Get link information
- `POST /api/location/update` - Update location (called by tracking file)
- `GET /api/location/:linkId` - Get all locations for a link
- `GET /api/media/:linkId` - Serve media file with tracking
- `GET /api/download/:linkId` - Download HTML file

## Environment Variables

### Backend (.env)
```
PORT=3001
BASE_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001/api
```

## Technologies Used

- **Backend:** Node.js, Express.js
- **Frontend:** React, React Router
- **Maps:** Google Maps Embed API
- **Storage:** In-memory (for production, use MongoDB/PostgreSQL)

## License

ISC
