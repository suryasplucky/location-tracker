import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ViewLocations.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function ViewLocations() {
  const { linkId } = useParams();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshIntervalRef = React.useRef(null);

  useEffect(() => {
    fetchLocations();
    
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchLocations();
      }, 3000); // Refresh every 3 seconds
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [linkId, autoRefresh]);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/location/${linkId}`);
      if (response.data.success) {
        setLocations(response.data.locations);
        setError('');
      } else {
        setError('Failed to fetch locations');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const latestLocation = locations.length > 0 ? locations[locations.length - 1] : null;

  return (
    <div className="view-container">
      <div className="container">
        <div className="card">
          <div className="header-section">
            <h1>📍 Tracked Locations</h1>
            <div className="controls">
              <button className="button" onClick={fetchLocations} disabled={loading}>
                {loading ? 'Refreshing...' : '🔄 Refresh'}
              </button>
              <button 
                className={`button ${autoRefresh ? 'active' : ''}`}
                onClick={toggleAutoRefresh}
              >
                {autoRefresh ? '⏸️ Pause Auto-Refresh' : '▶️ Resume Auto-Refresh'}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading && locations.length === 0 ? (
            <div className="loading">Loading locations...</div>
          ) : locations.length === 0 ? (
            <div className="status info">
              <p>No location updates yet. Share the link and wait for location updates.</p>
            </div>
          ) : (
            <>
              {latestLocation && (
                <div className="latest-location">
                  <h2>📍 Latest Location</h2>
                  <div className="location-card">
                    <div className="location-coords">
                      <p><strong>Latitude:</strong> {parseFloat(latestLocation.latitude).toFixed(6)}</p>
                      <p><strong>Longitude:</strong> {parseFloat(latestLocation.longitude).toFixed(6)}</p>
                      <p><strong>Time:</strong> {new Date(latestLocation.timestamp).toLocaleString()}</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${latestLocation.latitude},${latestLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button"
                    >
                      🗺️ Open in Google Maps
                    </a>
                  </div>
                  <div className="map-container">
                    <h3>📍 Location on Map</h3>
                    <iframe
                      title="Latest Location Map"
                      width="100%"
                      height="400"
                      style={{ border: 0, borderRadius: '8px' }}
                      src={`https://maps.google.com/maps?q=${latestLocation.latitude},${latestLocation.longitude}&hl=en&z=15&output=embed`}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              )}

              <div className="locations-list">
                <h2>Location History ({locations.length} updates)</h2>
                <div className="locations-container">
                  {locations.slice().reverse().map((location, index) => (
                    <div key={index} className="location-item">
                      <div className="location-details">
                        <p className="location-coord">
                          <span className="label">Lat:</span> {parseFloat(location.latitude).toFixed(6)}
                        </p>
                        <p className="location-coord">
                          <span className="label">Lng:</span> {parseFloat(location.longitude).toFixed(6)}
                        </p>
                        <p className="location-time">
                          {new Date(location.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="location-actions">
                        <a
                          href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="map-link-button"
                          title="Open in Google Maps"
                        >
                          🗺️
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewLocations;

