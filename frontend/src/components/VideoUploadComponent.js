import React, { useState, useRef } from 'react';
import axios from 'axios';

const VideoUploadComponent = ({ onUploadSuccess, onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const fileInputRef = useRef(null);
  
  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api';
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'video/mp4') {
      setFile(selectedFile);
    } else {
      alert('Please select an MP4 video file');
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'video/mp4') {
      setFile(droppedFile);
    } else {
      alert('Please drop an MP4 video file');
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }
    
    setIsUploading(true);
    setAnalysisStatus('Uploading video...');
    
    const formData = new FormData();
    formData.append('video', file);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      const receivedJobId = response.data.job_id;
      setAnalysisStatus('Video uploaded. Starting analysis...');
      
      // Pass job ID to parent component
      if (onUploadSuccess) {
        onUploadSuccess(receivedJobId);
      }
      
      // Start polling for job status
      pollProcessingStatus(receivedJobId);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsUploading(false);
      setAnalysisStatus('Upload failed. Please try again.');
    }
  };
  
  const pollProcessingStatus = async (jobId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/status/${jobId}`);
      
      if (response.data.status === 'completed') {
        setIsUploading(false);
        setAnalysisStatus('Analysis complete!');
        
        // Get the actual results
        const resultsResponse = await axios.get(`${API_BASE_URL}/results/${jobId}`);
        
        // Pass results to parent component
        if (onAnalysisComplete) {
          onAnalysisComplete(resultsResponse.data);
        }
      } else if (response.data.status === 'failed') {
        setIsUploading(false);
        setAnalysisStatus('Analysis failed. Please try again.');
      } else {
        // Still processing
        setAnalysisStatus(`${response.data.current_step}: ${response.data.progress}%`);
        // Poll again after 2 seconds
        setTimeout(() => pollProcessingStatus(jobId), 2000);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setIsUploading(false);
      setAnalysisStatus('Status check failed. Please try again.');
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Video for Sentiment Analysis</h2>
      
      <div 
        className="drop-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        {file ? (
          <div>
            <p>Selected file: {file.name}</p>
            <p>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        ) : (
          <p>Drag and drop an MP4 video here, or click to select</p>
        )}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept="video/mp4"
        />
      </div>
      
      {file && !isUploading && (
        <button 
          className="upload-button"
          onClick={handleUpload}
        >
          Analyze Video
        </button>
      )}
      
      {isUploading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="status-text">{analysisStatus}</p>
        </div>
      )}
    </div>
  );
};

export default VideoUploadComponent;