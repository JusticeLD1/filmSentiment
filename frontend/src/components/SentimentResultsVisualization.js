import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const SentimentResultsVisualization = ({ results }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  
  // If no results are available, show a message
  if (!results || !results.segments || results.segments.length === 0) {
    return (
      <div className="results-container">
        <h2>Sentiment Analysis Results</h2>
        <p>No results available. Please analyze a video first.</p>
      </div>
    );
  }
  
  // Function to convert timestamp to seconds for charting
  const timeToSeconds = (timestamp) => {
    if (!timestamp) return 0;
    const [minutes, seconds] = timestamp.split(':').map(Number);
    return minutes * 60 + seconds;
  };
  
  // Convert timestamps to seconds for chart
  const chartData = results.segments.map(item => ({
    ...item,
    seconds: timeToSeconds(item.timestamp)
  }));
  
  // Find emotionally intense moments (high absolute sentiment values)
  const intenseMoments = chartData.filter(item => Math.abs(item.sentiment) > 0.7);
  
  // Determine sentiment color
  const getSentimentColor = (score) => {
    if (score > 0.5) return '#4CAF50'; // Positive - Green
    if (score > 0) return '#8BC34A';   // Slightly positive - Light Green
    if (score > -0.5) return '#FFC107'; // Slightly negative - Amber
    return '#F44336';                   // Negative - Red
  };
  
  // Calculate average sentiment
  const averageSentiment = chartData.reduce((sum, item) => sum + item.sentiment, 0) / chartData.length;
  
  // Handle row selection
  const handleRowClick = (index) => {
    setSelectedRow(index === selectedRow ? null : index);
  };
  
  return (
    <div className="results-container">
      <h2>Sentiment Analysis Results</h2>
      <div className="summary-stats">
        <div className="stat-box">
          <h4>Video</h4>
          <p>{results.filename}</p>
        </div>
        <div className="stat-box">
          <h4>Duration</h4>
          <p>{Math.floor(results.duration / 60)}:{(results.duration % 60).toString().padStart(2, '0')}</p>
        </div>
        <div className="stat-box">
          <h4>Dialogues</h4>
          <p>{results.segments.length}</p>
        </div>
        <div className="stat-box">
          <h4>Average Sentiment</h4>
          <p style={{ color: getSentimentColor(averageSentiment) }}>{averageSentiment.toFixed(2)}</p>
        </div>
        <div className="stat-box">
          <h4>Emotional Peaks</h4>
          <p>{intenseMoments.length}</p>
        </div>
      </div>
      
      <div className="chart-container">
        <h3>Sentiment Timeline</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="seconds" 
              name="Time" 
              label={{ value: 'Time (seconds)', position: 'insideBottomRight', offset: -5 }}
              tickFormatter={(seconds) => {
                const min = Math.floor(seconds / 60);
                const sec = seconds % 60;
                return `${min}:${sec < 10 ? '0' + sec : sec}`;
              }}
            />
            <YAxis 
              domain={[-1, 1]} 
              label={{ value: 'Sentiment Score', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value, name) => [value.toFixed(2), 'Sentiment Score']}
              labelFormatter={(seconds) => {
                const min = Math.floor(seconds / 60);
                const sec = seconds % 60;
                return `Time: ${min}:${sec < 10 ? '0' + sec : sec}`;
              }}
            />
            <ReferenceLine y={0} stroke="#666" />
            <Line 
              type="monotone" 
              dataKey="sentiment" 
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
              strokeWidth={2}
            />
            
            {/* Highlight emotionally intense moments */}
            {intenseMoments.map((moment, index) => (
              <ReferenceLine 
                key={index}
                x={moment.seconds} 
                stroke={getSentimentColor(moment.sentiment)}
                strokeDasharray="3 3" 
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="dialogue-table-container">
        <h3>Dialogue Breakdown</h3>
        <div className="emotion-legend">
          <div className="legend-item">
            <span className="color-box positive"></span>
            <span>Positive</span>
          </div>
          <div className="legend-item">
            <span className="color-box negative"></span>
            <span>Negative</span>
          </div>
          <div className="legend-item">
            <span className="color-box neutral"></span>
            <span>Neutral</span>
          </div>
        </div>
        
        <table className="dialogue-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Speaker</th>
              <th>Dialogue</th>
              <th>Sentiment</th>
              <th>Emotion</th>
            </tr>
          </thead>
          <tbody>
            {results.segments.map((row, index) => (
              <tr 
                key={index}
                className={selectedRow === index ? 'selected' : ''}
                onClick={() => handleRowClick(index)}
                style={{ backgroundColor: `rgba(${row.sentiment < 0 ? '244, 67, 54' : '76, 175, 80'}, ${Math.abs(row.sentiment) * 0.3})` }}
              >
                <td>{row.timestamp}</td>
                <td>{row.speaker}</td>
                <td>{row.text}</td>
                <td>
                  <div className="sentiment-bar-container">
                    <div 
                      className={`sentiment-bar ${row.sentiment >= 0 ? 'positive' : 'negative'}`}
                      style={{ 
                        width: `${Math.abs(row.sentiment) * 100}%`,
                        backgroundColor: getSentimentColor(row.sentiment)
                      }}
                    ></div>
                    <span>{row.sentiment.toFixed(2)}</span>
                  </div>
                </td>
                <td>{row.emotion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {intenseMoments.length > 0 && (
        <div className="highlights-container">
          <h3>Emotional Highlights</h3>
          <ul className="highlights-list">
            {intenseMoments.map((moment, index) => (
              <li key={index} className="highlight-item">
                <span className="highlight-time">{moment.timestamp}</span>
                <span 
                  className="highlight-emotion"
                  style={{ color: getSentimentColor(moment.sentiment) }}
                >
                  {moment.emotion}
                </span>
                <span className="highlight-text">"{moment.text}"</span>
                <span 
                  className="highlight-sentiment"
                  style={{ color: getSentimentColor(moment.sentiment) }}
                >
                  {moment.sentiment.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SentimentResultsVisualization;