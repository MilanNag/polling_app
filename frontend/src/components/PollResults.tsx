import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Types
interface Poll {
  id: string;
  question: string;
  options: string[];
  results: number[];
  totalVotes: number;
  isActive: boolean;
  expiresAt: string;
  userVote: { optionIndex: number } | null;
}

interface PollResultsProps {
  pollId: string;
  apiUrl: string;
  token?: string;
}

const PollResults: React.FC<PollResultsProps> = ({ pollId, apiUrl, token }) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [votingInProgress, setVotingInProgress] = useState<boolean>(false);

  // Function to fetch poll data
  const fetchPoll = async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/poll/${pollId}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch poll');
      }
      
      const data = await response.json();
      setPoll(data);
      
      if (data.userVote) {
        setSelectedOption(data.userVote.optionIndex);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to cast a vote
  const castVote = async (optionIndex: number) => {
    if (!token) {
      setError('Authentication required to vote');
      return;
    }
    
    setVotingInProgress(true);
    
    try {
      const response = await fetch(`${apiUrl}/poll/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ optionIndex }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cast vote');
      }
      
      // Vote was successful
      setSelectedOption(optionIndex);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cast vote');
    } finally {
      setVotingInProgress(false);
    }
  };

  // Set up WebSocket connection and poll data fetching
  useEffect(() => {
    // Fetch initial poll data
    fetchPoll();
    
    // Connect to WebSocket
    const socket = io(`${apiUrl}`, {
      transports: ['websocket'],
      auth: token ? { token } : undefined,
    });
    
    // Subscribe to poll updates
    socket.emit('subscribe', pollId);
    
    // Listen for poll updates
    socket.on('vote-update', (data) => {
      if (data.pollId === pollId) {
        // Update poll results
        setPoll((prevPoll) => {
          if (!prevPoll) return null;
          
          return {
            ...prevPoll,
            results: data.results,
            totalVotes: data.totalVotes,
          };
        });
      }
    });
    
    // Clean up on unmount
    return () => {
      socket.emit('unsubscribe', pollId);
      socket.disconnect();
    };
  }, [pollId, apiUrl, token]);
  
  // Calculate time remaining
  const calculateTimeRemaining = (): string => {
    if (!poll) return '';
    
    const now = new Date();
    const expiresAt = new Date(poll.expiresAt);
    
    if (now > expiresAt || !poll.isActive) {
      return 'Poll has ended';
    }
    
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffMins}m ${diffSecs}s remaining`;
  };
  
  // Calculate percentage for an option
  const calculatePercentage = (index: number): number => {
    if (!poll || poll.totalVotes === 0) return 0;
    return (poll.results[index] / poll.totalVotes) * 100;
  };
  
  if (loading) {
    return <div className="loading">Loading poll...</div>;
  }
  
  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  
  if (!poll) {
    return <div className="error">Poll not found</div>;
  }
  
  return (
    <div className="poll-container">
      <h2 className="poll-question">{poll.question}</h2>
      
      <div className="poll-status">
        <span className={`status-indicator ${poll.isActive ? 'active' : 'inactive'}`}>
          {poll.isActive ? 'Active' : 'Closed'}
        </span>
        <span className="time-remaining">{calculateTimeRemaining()}</span>
      </div>
      
      <div className="poll-options">
        {poll.options.map((option, index) => (
          <div 
            key={index}
            className={`poll-option ${selectedOption === index ? 'selected' : ''}`}
            onClick={() => poll.isActive && !votingInProgress && castVote(index)}
          >
            <div className="option-label">{option}</div>
            
            <div className="option-bar-container">
              <div 
                className="option-bar" 
                style={{ width: `${calculatePercentage(index)}%` }}
              />
              <div className="option-percentage">
                {calculatePercentage(index).toFixed(1)}%
              </div>
              <div className="option-votes">
                {poll.results[index]} vote{poll.results[index] !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="poll-footer">
        <div className="total-votes">
          Total votes: {poll.totalVotes}
        </div>
        
        {!poll.isActive && (
          <div className="poll-closed-message">
            This poll is closed. No more votes can be submitted.
          </div>
        )}
        
        {selectedOption !== null && (
          <div className="user-vote-message">
            You voted for: <strong>{poll.options[selectedOption]}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollResults;