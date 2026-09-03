import { useState } from 'react';
import axios from 'axios';

function App() {
  const [emailState, setEmailState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState(null);
  const [toEmail, setToEmail] = useState('');

  const fetchEmail = async () => {
    setIsLoading(true);
    setDraft(null);
    setToEmail('');

    try {
      setTimeout(async () => {
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
      }, 800);
    } catch (e) {
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

        const match = emailState.sender.match(/<([^>]+)>/);
        const extractedEmail = match ? match[1] : emailState.sender.trim();
        setToEmail(extractedEmail);
      }
    } catch (error) {
      console.error("Error submitting decision:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSend = async () => {
    if (!toEmail) {
      alert("Please specify a recipient email address.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/confirm-send', {
        thread_id: 'thread-1',
        approved_text: draft,
        to_email: toEmail
      });

      if (response.data.status === 'sent_successfully') {
        alert("Email sent successfully! ");
        setEmailState(null);
        setDraft(null);
        setToEmail('');
      } else {
        alert("Failed to send the email.");
      }
    } catch (error) {
      console.error("Error confirming send:", error);
      alert("Error confirming send. Please check the backend logs.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Styles ---
  const theme = {
    bg: '#030712',
    panelBg: 'rgba(15, 23, 42, 0.7)',
    panelBorder: '#1e293b',
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    accentCyan: '#06b6d4',
    accentGreen: '#10b981',
    accentGold: '#eab308'
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: theme.bg,
      backgroundImage: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #030712 60%)',
      color: theme.textMain,
      fontFamily: '"Inter", "Segoe UI", Tahoma, sans-serif',
      padding: '2rem',
      boxSizing: 'border-box',
      direction: 'ltr'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '800',
      margin: '0 0 0.5rem 0',
      textShadow: `0 0 20px ${theme.accentCyan}40`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px'
    },
    subtitle: {
      color: theme.textMuted,
      fontSize: '0.9rem',
      letterSpacing: '1px',
      textTransform: 'uppercase'
    },
    analyzeBtnContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '2rem'
    },
    analyzeBtn: {
      background: 'linear-gradient(90deg, rgba(6,182,212,0.1) 0%, rgba(6,182,212,0.3) 50%, rgba(6,182,212,0.1) 100%)',
      border: `1px solid ${theme.accentCyan}`,
      color: theme.accentCyan,
      padding: '12px 40px',
      fontSize: '1rem',
      fontWeight: '700',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      borderRadius: '4px',
      cursor: isLoading ? 'wait' : 'pointer',
      boxShadow: `0 0 15px ${theme.accentCyan}40`,
      transition: 'all 0.3s ease',
      outline: 'none'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '250px 1fr 300px',
      gap: '20px',
      maxWidth: '1400px',
      margin: '0 auto',
      alignItems: 'start'
    },
    panel: {
      backgroundColor: theme.panelBg,
      border: `1px solid ${theme.panelBorder}`,
      borderRadius: '8px',
      padding: '20px',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
    },
    panelHeader: {
      fontSize: '0.85rem',
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '15px',
      borderBottom: `1px solid ${theme.panelBorder}`,
      paddingBottom: '10px',
      textAlign: 'center'
    },
    statBox: {
      marginBottom: '20px'
    },
    statLabel: {
      fontSize: '0.8rem',
      color: theme.textMuted
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: theme.accentCyan
    },
    communicationHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${theme.panelBorder}`,
      paddingBottom: '15px',
      marginBottom: '15px'
    },
    emailBody: {
      backgroundColor: 'rgba(2, 6, 23, 0.5)',
      color: '#e2e8f0',
      borderRadius: '6px',
      padding: '15px',
      maxHeight: '350px',
      overflowY: 'auto',
      fontSize: '0.9rem',
      lineHeight: '1.6',
      border: `1px solid ${theme.panelBorder}`,
      wordBreak: 'break-word'
    },
    actionCard: {
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
      border: `1px solid ${theme.panelBorder}`,
      borderRadius: '6px',
      padding: '12px 15px',
      marginBottom: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    draftArea: {
      width: '100%',
      minHeight: '150px',
      backgroundColor: '#020617',
      border: `1px solid ${theme.panelBorder}`,
      color: '#a7f3d0',
      padding: '15px',
      borderRadius: '6px',
      fontFamily: '"Fira Code", monospace',
      fontSize: '0.9rem',
      lineHeight: '1.5',
      resize: 'vertical',
      boxSizing: 'border-box'
    },
    emailInput: {
      width: '100%',
      backgroundColor: '#020617',
      border: `1px solid ${theme.panelBorder}`,
      color: theme.accentCyan,
      padding: '10px 15px',
      borderRadius: '6px',
      fontFamily: '"Fira Code", monospace',
      fontSize: '0.9rem',
      boxSizing: 'border-box',
      outline: 'none',
      direction: 'ltr'
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          <span style={{ color: theme.accentGold }}></span> AI Inbox Copilot
        </h1>
        <p style={styles.subtitle}>Harnessing Advanced Language Models to Tame Your Communications.</p>
      </header>

      <div style={styles.analyzeBtnContainer}>
        <button
          onClick={fetchEmail}
          disabled={isLoading}
          style={styles.analyzeBtn}
        >
          {isLoading && !emailState ? 'Analyzing Communication Flows...' : 'Analyze Inbox'}
        </button>
      </div>

      <div style={styles.grid}>

        {/* LEFT COLUMN */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>AI Performance Insights</div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Total Emails Processed</div>
            <div style={styles.statValue}>15k</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Inbox Sentiment Score</div>
            <div style={{...styles.statValue, color: theme.accentGreen, fontSize: '1.2rem'}}>Neutral-Positive</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Top Thread Priorities</div>
            <ul style={{ color: theme.textMuted, fontSize: '0.85rem', paddingLeft: '20px', marginTop: '5px' }}>
              <li>Project Proposals</li>
              <li>Client Escalations</li>
              <li>Meeting Schedules</li>
            </ul>
          </div>
        </div>

        {/* MIDDLE COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{...styles.panel, minHeight: '250px'}}>
            <div style={styles.panelHeader}>Communication Pane</div>

            {emailState ? (
              <>
                <div style={styles.communicationHeader}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>THREAD ID: thread-1</div>
                    <div dir="auto" style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '5px', color: theme.textMain }}>{emailState.subject}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>SENDER</div>
                    <div dir="auto" style={{ fontSize: '0.85rem', color: theme.accentCyan }}>{emailState.sender}</div>
                  </div>
                </div>

                <div
                  dir="auto"
                  style={styles.emailBody}
                  dangerouslySetInnerHTML={{ __html: emailState.body }}
                />
              </>
            ) : (
              <div style={{ color: theme.textMuted, textAlign: 'center', marginTop: '40px' }}>
                Awaiting Inbox Data...
              </div>
            )}
          </div>

          {draft && (
            <div style={{...styles.panel, border: `1px solid ${theme.accentGreen}50`}}>
              <div style={{...styles.panelHeader, color: theme.accentGreen, borderBottomColor: `${theme.accentGreen}30`}}>
                 Draft Ready for Human Review
              </div>

              <div style={{ marginBottom: '15px' }}>
                 <label style={{ display: 'block', fontSize: '0.8rem', color: theme.textMuted, marginBottom: '5px' }}>Recipient (To):</label>
                 <input
                   type="email"
                   value={toEmail}
                   onChange={(e) => setToEmail(e.target.value)}
                   style={styles.emailInput}
                 />
              </div>

              <label style={{ display: 'block', fontSize: '0.8rem', color: theme.textMuted, marginBottom: '5px' }}>Message Body:</label>
              <textarea
                dir="auto"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                style={styles.draftArea}
              />

              <button
                onClick={handleConfirmSend}
                disabled={isLoading}
                style={{
                  marginTop: '15px',
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: `1px solid ${theme.accentGreen}`,
                  color: theme.accentGreen,
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  cursor: isLoading ? 'wait' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: `0 0 10px ${theme.accentGreen}40`
                }}
              >
                {isLoading ? 'Dispatching...' : 'Finalize & Dispatch ✉️'}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{...styles.panel, border: emailState && !draft ? `1px solid ${theme.accentGold}` : styles.panel.border}}>
            <div style={{...styles.panelHeader, color: emailState && !draft ? theme.accentGold : theme.textMuted }}>
              AI Strategy Pane
            </div>

            {!draft && emailState?.suggested_actions ? (
              <>
                <div style={{ color: theme.accentGold, fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px' }}>
                  ⏸️ Agent Paused: Awaiting Decision
                </div>
                {emailState.suggested_actions.map((action, index) => (
                  <div
                    key={index}
                    onClick={() => !isLoading && handleDecision(action)}
                    style={{
                      ...styles.actionCard,
                      borderColor: index === 0 ? theme.accentGreen : theme.panelBorder,
                      opacity: isLoading ? 0.5 : 1
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)'}
                  >
                    <div dir="auto" style={{ color: index === 0 ? theme.accentGreen : theme.textMain, fontWeight: '600', fontSize: '0.9rem', lineHeight: '1.4' }}>
                      {action}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: theme.textMuted, borderTop: `1px solid ${theme.panelBorder}`, paddingTop: '6px' }}>
                      Confidence: High Match
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ color: theme.textMuted, fontSize: '0.85rem', textAlign: 'center' }}>
                System idle. Awaiting context to generate strategies.
              </div>
            )}
          </div>

          <div style={{...styles.panel, marginTop: 'auto'}}>
             <div style={styles.panelHeader}>System Status</div>
             <div style={{ fontSize: '0.8rem', color: theme.textMuted, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><span style={{color: theme.accentGreen}}>●</span> LLM Model: Copilot-Pro</div>
                <div><span style={{color: theme.accentGreen}}>●</span> FastAPI Connected</div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;