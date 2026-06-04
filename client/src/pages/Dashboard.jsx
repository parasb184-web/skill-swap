import React, { useState } from 'react';
import MatchCard from '../components/MatchCard';
import ProfileSetup from '../components/ProfileSetup';
import { Mail, Check, MessageCircle, AlertCircle, RefreshCw, Layers, Users } from 'lucide-react';

export default function Dashboard({ 
  user, 
  recommendations, 
  matches, 
  pendingRequests,
  onUpdateProfile, 
  onSendMatchRequest, 
  onRespondToMatch,
  loadingRecommendations,
  loadingMatches,
  isSavingProfile,
  isProcessingMatch
}) {
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'connections'

  return (
    <div className="container" style={styles.container}>
      <div className="dashboard-grid">
        
        {/* Left Side: Explore/Recommendations or Connections */}
        <div style={styles.mainFeed}>
          {/* Dashboard Tabs */}
          <div className="glass-card" style={styles.tabPanel}>
            <button 
              onClick={() => setActiveTab('explore')}
              style={{
                ...styles.tabBtn,
                color: activeTab === 'explore' ? 'var(--secondary)' : 'var(--text-secondary)',
                backgroundColor: activeTab === 'explore' ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                borderColor: activeTab === 'explore' ? 'rgba(6, 182, 212, 0.2)' : 'transparent'
              }}
            >
              <Layers size={16} />
              Explore Recommendations
            </button>
            <button 
              onClick={() => setActiveTab('connections')}
              style={{
                ...styles.tabBtn,
                color: activeTab === 'connections' ? 'var(--primary-hover)' : 'var(--text-secondary)',
                backgroundColor: activeTab === 'connections' ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                borderColor: activeTab === 'connections' ? 'rgba(139, 92, 246, 0.2)' : 'transparent'
              }}
            >
              <Users size={16} />
              My Swaps ({matches.length})
            </button>
          </div>

          {/* Explore Tab content */}
          {activeTab === 'explore' && (
            <div>
              <div style={styles.sectionTitleRow}>
                <h2 style={styles.sectionTitle}>Recommended Swappers</h2>
                {loadingRecommendations && <RefreshCw size={18} className="spin-icon" color="var(--secondary)" />}
              </div>
              
              {loadingRecommendations && recommendations.length === 0 ? (
                <div style={styles.loadingState}>
                  <RefreshCw size={24} className="spin-icon" color="var(--secondary)" />
                  <p>Calculating matches using KNN...</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="glass-card" style={styles.emptyState}>
                  <AlertCircle size={32} color="var(--text-muted)" />
                  <h3>No recommendations found</h3>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Try expanding your "Skills I Can Teach" or "Skills I Want to Learn" in the profile panel to get more matches.
                  </p>
                </div>
              ) : (
                <div style={styles.cardList}>
                  {recommendations.map((rec) => (
                    <MatchCard 
                      key={rec.user.id} 
                      recommendation={rec}
                      onAccept={onSendMatchRequest}
                      onDecline={onRespondToMatch} // if they click pass and it's a pending received request, or simply hiding it. For simple logic, we pass user ID to decline
                      isProcessing={isProcessingMatch}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Connections Tab content */}
          {activeTab === 'connections' && (
            <div>
              {/* Received Pending Requests Sub-Section */}
              {pendingRequests.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ ...styles.sectionTitle, color: 'var(--secondary)', marginBottom: '16px' }}>
                    Pending Requests ({pendingRequests.length})
                  </h3>
                  <div style={styles.cardList}>
                    {pendingRequests.map((req) => (
                      <div key={req.matchId} className="glass-card" style={styles.pendingRequestCard}>
                        <div>
                          <h4 style={styles.partnerName}>{req.requester.name}</h4>
                          <p style={styles.partnerBio}>"{req.requester.bio}"</p>
                          <div style={{ marginTop: '10px' }}>
                            <span style={styles.badgeLabel}>Teaches:</span>
                            {req.requester.skills.map((s, i) => (
                              <span key={i} className="badge badge-teach">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div style={styles.pendingActions}>
                          <button 
                            onClick={() => onRespondToMatch(req.matchId, 'decline')}
                            className="btn btn-danger"
                            style={styles.pendingActionBtn}
                            disabled={isProcessingMatch}
                          >
                            Decline
                          </button>
                          <button 
                            onClick={() => onRespondToMatch(req.matchId, 'accept')}
                            className="btn btn-success"
                            style={styles.pendingActionBtn}
                            disabled={isProcessingMatch}
                          >
                            Accept Swap
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Connections */}
              <h2 style={styles.sectionTitle}>Active Skill Swaps</h2>
              
              {loadingMatches ? (
                <div style={styles.loadingState}>
                  <RefreshCw size={24} className="spin-icon" color="var(--primary)" />
                  <p>Loading active swaps...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="glass-card" style={styles.emptyState}>
                  <Users size={32} color="var(--text-muted)" />
                  <h3>No active swaps yet</h3>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Check out your Recommendations feed and request a swap with compatible learners.
                  </p>
                </div>
              ) : (
                <div style={styles.cardList}>
                  {matches.map((m) => (
                    <div key={m.matchId} className="glass-card anim-slide-up" style={styles.connectionCard}>
                      <div style={styles.connectionHeader}>
                        <div>
                          <h3 style={styles.partnerName}>{m.partner.name}</h3>
                          <div style={styles.emailContainer}>
                            <Mail size={14} color="var(--secondary)" />
                            <a href={`mailto:${m.partner.email}`} style={styles.partnerEmail}>{m.partner.email}</a>
                          </div>
                        </div>
                        <div style={styles.connectedBadge}>
                          <Check size={12} />
                          Active Connection
                        </div>
                      </div>
                      
                      <p style={{ ...styles.partnerBio, margin: '12px 0' }}>"{m.partner.bio}"</p>

                      <div style={styles.skillsSection}>
                        <div>
                          <span style={styles.colTitle}>Teach them:</span>
                          <div style={{ marginTop: '6px' }}>
                            {/* What we teach them = partner's interests that overlap with our skills, or just all partner's interests */}
                            {m.partner.interests.map((int, i) => (
                              <span key={i} className="badge badge-learn">{int}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span style={styles.colTitle}>Learn from them:</span>
                          <div style={{ marginTop: '6px' }}>
                            {/* What they teach us = partner's skills that overlap with our interests, or just all partner's skills */}
                            {m.partner.skills.map((sk, i) => (
                              <span key={i} className="badge badge-teach">{sk}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={styles.contactFooter}>
                        <MessageCircle size={16} />
                        <span>Send an email to set up your first peer learning call!</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Profile Setup Panel */}
        <div style={styles.sidePanel}>
          <ProfileSetup 
            user={user} 
            onSave={onUpdateProfile} 
            isSaving={isSavingProfile} 
          />
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    paddingTop: '20px',
    paddingBottom: '60px',
  },
  mainFeed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  tabPanel: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
  },
  tabBtn: {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    border: '1px solid transparent',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    background: 'transparent',
    transition: 'all 0.2s ease',
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#fff',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '60px 0',
    color: 'var(--text-secondary)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '60px 20px',
    borderRadius: '16px',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sidePanel: {
    alignSelf: 'start',
  },
  // Pending Request styles
  pendingRequestCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
  },
  partnerName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '4px',
  },
  partnerBio: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    fontStyle: 'italic',
  },
  badgeLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'var(--text-muted)',
    marginRight: '8px',
  },
  pendingActions: {
    display: 'flex',
    gap: '10px',
  },
  pendingActionBtn: {
    padding: '8px 16px',
    fontSize: '13px',
  },
  // Connection Card styles
  connectionCard: {
    padding: '24px',
    borderLeft: '4px solid var(--secondary)',
  },
  connectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  emailContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
  },
  partnerEmail: {
    fontSize: '13px',
    color: 'var(--secondary)',
    textDecoration: 'none',
    fontWeight: '600',
  },
  connectedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(16, 185, 129, 0.1)',
    color: 'var(--success)',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  skillsSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    background: 'rgba(0,0,0,0.15)',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.02)',
  },
  colTitle: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  contactFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    color: 'var(--text-secondary)',
    fontSize: '12px',
  }
};
