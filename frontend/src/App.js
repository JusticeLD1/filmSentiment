import React, { useState } from 'react';
import VideoUploadComponent from './components/VideoUploadComponent';
import SentimentResultsVisualization from './components/SentimentResultsVisualization';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('upload');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [jobId, setJobId] = useState(null);
  
  // Function to handle successful upload and start analysis
  const handleUploadSuccess = (receivedJobId) => {
    setJobId(receivedJobId);
  };
  
  // Function to handle completed analysis
  const handleAnalysisComplete = (results) => {
    setAnalysisResults(results);
    setCurrentScreen('results');
  };
  
  // Function to go back to upload screen
  const handleBackToUpload = () => {
    setCurrentScreen('upload');
    setAnalysisResults(null);
    setJobId(null);
  };
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>FilmClip Sentiment Analyzer</h1>
        <p>Analyze the emotional tone of dialogue in film clips</p>
      </header>
      
      <main className="app-content">
        {currentScreen === 'upload' && (
          <VideoUploadComponent 
            onUploadSuccess={handleUploadSuccess}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}
        
        {currentScreen === 'results' && (
          <>
            <button 
              className="back-button"
              onClick={handleBackToUpload}
            >
              ← Back to Upload
            </button>
            <SentimentResultsVisualization 
              results={analysisResults}
            />
          </>
        )}
      </main>
      
      <footer className="app-footer">
        <p>FilmClip Sentiment Analyzer &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;