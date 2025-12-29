const request = require('supertest');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Create test app (simplified version of server)
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const trackingLinks = new Map();
const locationUpdates = new Map();

// Test endpoints
app.post('/api/links/generate', (req, res) => {
  try {
    const { userId } = req.body;
    const linkId = uuidv4();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    trackingLinks.set(linkId, {
      userId: userId || 'anonymous',
      createdAt: new Date().toISOString(),
      isActive: true,
      linkId: linkId
    });
    
    locationUpdates.set(linkId, []);
    
    res.json({
      success: true,
      linkId: linkId,
      shareableLink: `${baseUrl}/track/${linkId}`,
      mediaFileUrl: `${baseUrl}/api/media/${linkId}`,
      downloadUrl: `${baseUrl}/api/download/${linkId}`,
      createdAt: trackingLinks.get(linkId).createdAt
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

app.post('/api/location/update', (req, res) => {
  try {
    const { linkId, latitude, longitude, deviceId } = req.body;
    
    if (!linkId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: linkId, latitude, longitude' 
      });
    }
    
    const linkData = trackingLinks.get(linkId);
    if (!linkData) {
      return res.status(404).json({ success: false, error: 'Invalid tracking link' });
    }
    
    if (!linkData.isActive) {
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
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      timestamp: locationData.timestamp
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

// Run tests
async function runTests() {
  console.log('🧪 Starting Unit Tests...\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Generate link
  try {
    const res = await request(app)
      .post('/api/links/generate')
      .send({ userId: 'test-user' });
    
    if (res.status === 200 && res.body.success && res.body.linkId) {
      console.log('✅ Test 1: Generate link - PASSED');
      passed++;
      
      const linkId = res.body.linkId;
      
      // Test 2: Get link info
      try {
        const linkRes = await request(app).get(`/api/links/${linkId}`);
        if (linkRes.status === 200 && linkRes.body.success) {
          console.log('✅ Test 2: Get link info - PASSED');
          passed++;
        } else {
          throw new Error('Failed to get link info');
        }
      } catch (err) {
        console.log('❌ Test 2: Get link info - FAILED:', err.message);
        failed++;
      }
      
      // Test 3: Update location
      try {
        const locationRes = await request(app)
          .post('/api/location/update')
          .send({
            linkId: linkId,
            latitude: 40.7128,
            longitude: -74.0060,
            deviceId: 'test-device'
          });
        
        if (locationRes.status === 200 && locationRes.body.success) {
          console.log('✅ Test 3: Update location - PASSED');
          passed++;
        } else {
          throw new Error('Failed to update location');
        }
      } catch (err) {
        console.log('❌ Test 3: Update location - FAILED:', err.message);
        failed++;
      }
      
      // Test 4: Get locations
      try {
        const locationsRes = await request(app).get(`/api/location/${linkId}`);
        if (locationsRes.status === 200 && locationsRes.body.success && locationsRes.body.count === 1) {
          console.log('✅ Test 4: Get locations - PASSED');
          passed++;
        } else {
          throw new Error('Failed to get locations');
        }
      } catch (err) {
        console.log('❌ Test 4: Get locations - FAILED:', err.message);
        failed++;
      }
      
      // Test 5: Invalid linkId
      try {
        const invalidRes = await request(app).get('/api/links/invalid-id');
        if (invalidRes.status === 404) {
          console.log('✅ Test 5: Invalid linkId handling - PASSED');
          passed++;
        } else {
          throw new Error('Should return 404 for invalid link');
        }
      } catch (err) {
        console.log('❌ Test 5: Invalid linkId handling - FAILED:', err.message);
        failed++;
      }
      
      // Test 6: Missing required fields
      try {
        const missingRes = await request(app)
          .post('/api/location/update')
          .send({ linkId: linkId });
        
        if (missingRes.status === 400) {
          console.log('✅ Test 6: Missing required fields validation - PASSED');
          passed++;
        } else {
          throw new Error('Should return 400 for missing fields');
        }
      } catch (err) {
        console.log('❌ Test 6: Missing required fields validation - FAILED:', err.message);
        failed++;
      }
      
    } else {
      throw new Error('Failed to generate link');
    }
  } catch (err) {
    console.log('❌ Test 1: Generate link - FAILED:', err.message);
    failed++;
  }

  console.log('\n📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
}

module.exports = { app, runTests };

