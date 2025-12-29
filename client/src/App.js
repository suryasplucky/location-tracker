import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import TrackLink from './components/TrackLink';
import ViewLocations from './components/ViewLocations';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/track/:linkId" element={<TrackLink />} />
          <Route path="/view/:linkId" element={<ViewLocations />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

