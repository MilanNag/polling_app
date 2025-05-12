import React, { useState, useEffect } from 'react';
import PollResults from './components/PollResults';

// API configuration
const API_URL = '/api';

interface CreatePollForm {
  question: string;
  options: string[];
  expiresAt: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activePollId, setActivePollId] = useState<string | null>(null);
  const [isCreatingPoll, setIsCreatingPoll] = useState<boolean>(false);
  const [pollForm, setPollForm] = useState<CreatePollForm>({
    question: '',
    options: ['', ''],
    expiresAt: new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16) // 30 minutes from now
  });
  const [error, setError] = useState<string | null>(null);

  // Auth on mount
  useEffect(() => {
    // Check local storage for existing token
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    
    if (storedToken && storedUserId) {
      setToken(storedToken);
      setUserId(storedUserId);
    } else {
      createAnonymousUser();
    }
  }, []);

  // Create anonymous user
  const createAnonymousUser = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/anon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create anonymous user');
      }
      
      const data: AuthResponse = await response.json();
      
      // Save to state and local storage
      setToken(data.token);
      setUserId(data.user.id);
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  // Handle poll form changes
  const handlePollFormChange = (field: keyof CreatePollForm, value: string) => {
    setPollForm({
      ...pollForm,
      [field]: value,
    });
  };

  // Handle option change
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollForm.options];
    newOptions[index] = value;
    
    setPollForm({
      ...pollForm,
      options: newOptions,
    });
  };

  // Add option
  const addOption = () => {
    if (pollForm.options.length < 10) {
      setPollForm({
        ...pollForm,
        options: [...pollForm.options, ''],
      });
    }
  };

  // Remove option
  const removeOption = (index: number) => {
    if (pollForm.options.length > 2) {
      const newOptions = [...pollForm.options];
      newOptions.splice(index, 1);
      
      setPollForm({
        ...pollForm,
        options: newOptions,
      });
    }
  };

  // Create poll
  const createPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Authentication required');
      return;
    }
    
    // Validate form
    if (!pollForm.question.trim()) {
      setError('Question is required');
      return;
    }
    
    if (pollForm.options.some(option => !option.trim())) {
      setError('All options must have a value');
      return;
    }
    
    const expiresAt = new Date(pollForm.expiresAt);
    if (isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      setError('Expiration date must be in the future');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/poll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: pollForm.question,
          options: pollForm.options,
          expiresAt: expiresAt.toISOString(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create poll');
      }
      
      const data = await response.json();
      
      // Show the created poll
      setActivePollId(data.id);
      setIsCreatingPoll(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Team Polls</h1>
        <p>Real-time polling for team meetings</p>
      </header>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <main className="app-main">
        {!token ? (
          <div className="loading">Authenticating...</div>
        ) : !activePollId && !isCreatingPoll ? (
          <div className="welcome-screen">
            <h2>Welcome to Team Polls!</h2>
            <p>Create a new poll or enter a poll ID to participate.</p>
            
            <div className="action-buttons">
              <button 
                className="primary-button"
                onClick={() => setIsCreatingPoll(true)}
              >
                Create New Poll
              </button>
              
              <div className="join-poll">
                <input
                  type="text"
                  placeholder="Enter Poll ID"
                  onChange={(e) => {
                    if (e.target.value.trim()) {
                      setActivePollId(e.target.value.trim());
                    }
                  }}
                />
                <button>Join Poll</button>
              </div>
            </div>
          </div>
        ) : isCreatingPoll ? (
          <div className="create-poll">
            <h2>Create a New Poll</h2>
            
            <form onSubmit={createPoll}>
              <div className="form-group">
                <label>Question</label>
                <input
                  type="text"
                  value={pollForm.question}
                  onChange={(e) => handlePollFormChange('question', e.target.value)}
                  placeholder="Enter your question"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Options</label>
                {pollForm.options.map((option, index) => (
                  <div key={index} className="option-input">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    {pollForm.options.length > 2 && (
                      <button 
                        type="button" 
                        className="remove-option"
                        onClick={() => removeOption(index)}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                
                {pollForm.options.length < 10 && (
                  <button 
                    type="button" 
                    className="add-option"
                    onClick={addOption}
                  >
                    + Add Option
                  </button>
                )}
              </div>
              
              <div className="form-group">
                <label>Expires At</label>
                <input
                  type="datetime-local"
                  value={pollForm.expiresAt}
                  onChange={(e) => handlePollFormChange('expiresAt', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel"
                  onClick={() => setIsCreatingPoll(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit">
                  Create Poll
                </button>
              </div>
            </form>
          </div>
        ) : activePollId ? (
          <div className="active-poll">
            <div className="poll-header">
              <h2>Poll Results</h2>
              <div className="poll-id">ID: {activePollId}</div>
            </div>
            
            <PollResults
              pollId={activePollId}
              apiUrl={API_URL}
              token={token}
            />
            
            <button 
              className="back-button"
              onClick={() => setActivePollId(null)}
            >
              Back to Main Screen
            </button>
          </div>
        ) : null}
      </main>
      
      <footer className="app-footer">
        <p>© 2025 Team Polls - Real-time polling for team meetings</p>
      </footer>
    </div>
  );
};

export default App;