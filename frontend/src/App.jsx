import { useState } from 'react';
import axios from 'axios';

function App() {
  const [emailState, setEmailState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState(null);

  const fetchEmail = async () => {
    setIsLoading(true);
    setDraft(null);

    try {
      const response = await axios.get('http://127.0.0.1:8000/api/fetch-and-analyze?thread_id=thread-1');
      if (response.data.status === 'waiting_for_decision') {
        setEmailState(response.data.state);
      } else {
        alert("No new emails found.");
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
      alert("Could not connect to the backend. Is FastAPI running?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (decision) => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/submit-decision', {
        thread_id: 'thread-1',
        decision: decision
      });

      if (response.data.status === 'draft_ready') {
        setDraft(response.data.draft);
      }
    } catch (error) {
      console.error("Error submitting decision:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSend = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/confirm-send', {
        thread_id: 'thread-1',
        approved_text: draft
      });

      if (response.data.status === 'sent_successfully') {
        alert("Email sent successfully! 🚀");
        setEmailState(null);
        setDraft(null);
      } else {
        alert("Failed to send the email.");
      }
    } catch (error) {
      console.error("Error confirming send:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      padding: '3rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      direction: 'ltr'
    }}>

      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        <h1 style={{ color: '#f8fafc', textAlign: 'center', marginBottom: '40px', fontWeight: '600', letterSpacing: '-0.5px' }}>
          <span style={{ color: '#a855f7' }}>⚡</span> AI Inbox Copilot
        </h1>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={fetchEmail}
            disabled={isLoading}
            style={{
              padding: '12px 28px',
              marginBottom: '32px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              backgroundColor: '#9333ea', // Purple matching the logo
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '15px',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(147, 51, 234, 0.4)',
              transition: 'opacity 0.2s',
              fontFamily: 'inherit'
            }}
          >
            {isLoading && !emailState ? 'Checking Inbox...' : 'Check New Emails'}
          </button>
        </div>

        {emailState && (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            border: '1px solid #334155'
          }}>
            <h2 style={{ color: '#f1f5f9', margin: '0 0 10px 0', fontSize: '1.3rem' }}>Subject: {emailState.subject}</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}><strong>From:</strong> {emailState.sender}</p>

            <hr style={{ borderColor: '#334155', margin: '20px 0' }} />
            <p style={{ lineHeight: '1.7', color: '#cbd5e1', whiteSpace: 'pre-wrap', fontSize: '15px' }}>{emailState.body}</p>

            {/* Action Buttons */}
            {!draft && emailState.suggested_actions && (
              <div style={{ marginTop: '35px', backgroundColor: '#0f172a', border: '1px solid #334155', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ color: '#a855f7', fontSize: '1rem', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⏸️ Agent Paused: Awaiting Decision
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {emailState.suggested_actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleDecision(action)}
                      disabled={isLoading}
                      style={{
                        padding: '12px 16px',
                        cursor: isLoading ? 'wait' : 'pointer',
                        textAlign: 'left',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        backgroundColor: '#1e293b',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        fontFamily: 'inherit'
                      }}
                    >
                      {isLoading ? 'Drafting...' : action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Draft Section */}
            {draft && (
              <div style={{ marginTop: '35px', backgroundColor: '#0f172a', border: '1px solid #334155', padding: '20px', borderRadius: '8px' }}>
                <h3 style={{ color: '#2dd4bf', fontSize: '1rem', margin: '0 0 16px 0' }}>
                  ✅ Draft Ready for Review
                </h3>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '160px',
                    padding: '16px',
                    boxSizing: 'border-box',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    direction: 'ltr'
                  }}
                />

                <button
                  onClick={handleConfirmSend}
                  disabled={isLoading}
                  style={{
                    marginTop: '16px',
                    padding: '12px 24px',
                    backgroundColor: '#9333ea', // Matching purple
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isLoading ? 'wait' : 'pointer',
                    width: '100%',
                    fontSize: '15px',
                    fontWeight: '600',
                    fontFamily: 'inherit'
                  }}
                >
                  {isLoading ? 'Sending...' : 'Confirm & Send Email ✉️'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;