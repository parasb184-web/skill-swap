import React from 'react';
import { Check, X, ArrowUpRight, CheckCircle, RefreshCw } from 'lucide-react';

export default function MatchCard({ recommendation, onAccept, onDecline, isProcessing }) {
  const { user, score, gives_match, receives_match, has_overlap, matchStatus } = recommendation;

  // Convert similarity score to a clean percentage string
  const percentage = Math.round(score * 100);

  // Generate a distinct color and shadow based on score strength
  const getGlowColor = () => {
    if (percentage >= 80) return 'rgba(6, 182, 212, 0.4)'; // Cyan glow
    if (percentage >= 50) return 'rgba(139, 92, 246, 0.3)'; // Purple glow
    return 'rgba(255, 255, 255, 0.05)';
  };

  return (
    <div 
      className="glass-card anim-slide-up" 
      style={{
        ...styles.card,
        boxShadow: `0 4px 30px rgba(0,0,0,0.3), 0 0 15px ${getGlowColor()}`
      }}
    >
      <div style={styles.header}>
        <div>
          <h3 style={styles.name}>{user.name}</h3>
          <p style={styles.bio}>"{user.bio || 'No bio provided yet.'}"</p>
        </div>
        <div style={styles.scoreContainer}>
          <div 
            style={{
              ...styles.scoreBadge,
              borderColor: percentage >= 75 ? 'var(--secondary)' : 'var(--primary)'
            }}
          >
            <span style={styles.scoreNumber}>{percentage}%</span>
            <span style={styles.scoreLabel}>Match</span>
          </div>
        </div>
      </div>

      {/* Match highlights */}
      {has_overlap && (
        <div style={styles.matchHighlights}>
          <div style={styles.highlightBadge}>
            <CheckCircle size={14} color="var(--secondary)" />
            <span>
              {gives_match > 0 && receives_match > 0 
                ? 'Mutual Skill Swap Potential!' 
                : gives_match > 0 
                ? 'Teaches your learning goals!' 
                : 'Learns what you teach!'}
            </span>
          </div>
        </div>
      )}

      <div style={styles.skillsSection}>
        <div style={styles.skillsColumn}>
          <span style={styles.sectionTitle}>Teaches</span>
          <div style={styles.badgeContainer}>
            {user.skills.map((skill, i) => (
              <span key={i} className="badge badge-teach">{skill}</span>
            ))}
            {user.skills.length === 0 && <span style={styles.emptyText}>None listed</span>}
          </div>
        </div>

        <div style={styles.skillsColumn}>
          <span style={styles.sectionTitle}>Wants to Learn</span>
          <div style={styles.badgeContainer}>
            {user.interests.map((interest, i) => (
              <span key={i} className="badge badge-learn">{interest}</span>
            ))}
            {user.interests.length === 0 && <span style={styles.emptyText}>None listed</span>}
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button 
          onClick={() => onDecline(user.id)} 
          className="btn btn-danger" 
          style={styles.actionBtn}
          disabled={isProcessing}
        >
          <X size={18} />
          <span>Pass</span>
        </button>

        <button 
          onClick={() => onAccept(user.id)} 
          className="btn btn-primary" 
          style={{ ...styles.actionBtn, ...styles.acceptBtn }}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <RefreshCw size={18} className="spin-icon" />
          ) : (
            <Check size={18} />
          )}
          <span>{matchStatus === 'pending_received' ? 'Accept Request' : 'Swap Skills'}</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
  },
  name: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '6px',
  },
  bio: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    fontStyle: 'italic',
  },
  scoreContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  scoreBadge: {
    width: '68px',
    height: '68px',
    borderRadius: '50%',
    border: '3px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15, 23, 42, 0.8)',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
  },
  scoreNumber: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: '9px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  matchHighlights: {
    display: 'flex',
    gap: '8px',
  },
  highlightBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'var(--secondary)',
    fontWeight: '600',
  },
  skillsSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    background: 'rgba(255, 255, 255, 0.01)',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.03)',
  },
  skillsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  badgeContainer: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  emptyText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px',
  },
  actionBtn: {
    flex: 1,
    height: '45px',
  },
  acceptBtn: {
    background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
  }
};
