import { Check, X, ArrowUpRight, CheckCircle, RefreshCw } from 'lucide-react';

export default function MatchCard({ recommendation, onAccept, onPass, isProcessing }) {
  const {
    user,
    score,
    gives_match,
    receives_match,
    has_overlap,
    matchStatus,
    gives_skills = [],
    receives_skills = []
  } = recommendation;

  const isIncomingRequest = matchStatus === 'pending_received';

  // Browse results carry no ML score, only recommendations do
  const hasScore = typeof score === 'number';
  const percentage = hasScore ? Math.round(score * 100) : 0;

  // Used to highlight the individual badges that drive the match
  const givesSet = new Set(gives_skills);
  const receivesSet = new Set(receives_skills);

  const SETTLED_LABELS = {
    accepted: 'Already connected',
    pending_sent: 'Swap request sent — waiting for a reply',
    declined: 'This swap was declined'
  };
  const settledLabel = SETTLED_LABELS[matchStatus];

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
        {hasScore && (
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
        )}
      </div>

      {/* Why this is a match: the concrete skills on both sides of the swap */}
      {has_overlap && (
        <div style={styles.matchHighlights}>
          {gives_match > 0 && receives_match > 0 && (
            <div style={styles.mutualBanner}>
              <CheckCircle size={14} color="var(--secondary)" />
              <span>Mutual Skill Swap Potential!</span>
            </div>
          )}

          {gives_skills.length > 0 && (
            <div style={styles.matchLine}>
              <span style={styles.matchLabel}>They can teach you</span>
              <div style={styles.matchBadges}>
                {gives_skills.map((skill) => (
                  <span key={skill} className="badge badge-teach">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {receives_skills.length > 0 && (
            <div style={styles.matchLine}>
              <span style={styles.matchLabel}>They want to learn from you</span>
              <div style={styles.matchBadges}>
                {receives_skills.map((skill) => (
                  <span key={skill} className="badge badge-learn">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={styles.skillsSection}>
        <div style={styles.skillsColumn}>
          <span style={styles.sectionTitle}>Teaches</span>
          <div style={styles.badgeContainer}>
            {user.skills.map((skill, i) => (
              <span
                key={i}
                className={`badge badge-teach${givesSet.has(skill) ? ' badge-match' : ''}`}
                title={givesSet.has(skill) ? 'You want to learn this' : undefined}
              >
                {skill}
              </span>
            ))}
            {user.skills.length === 0 && <span style={styles.emptyText}>None listed</span>}
          </div>
        </div>

        <div style={styles.skillsColumn}>
          <span style={styles.sectionTitle}>Wants to Learn</span>
          <div style={styles.badgeContainer}>
            {user.interests.map((interest, i) => (
              <span
                key={i}
                className={`badge badge-learn${receivesSet.has(interest) ? ' badge-match' : ''}`}
                title={receivesSet.has(interest) ? 'You can teach this' : undefined}
              >
                {interest}
              </span>
            ))}
            {user.interests.length === 0 && <span style={styles.emptyText}>None listed</span>}
          </div>
        </div>
      </div>

      {isIncomingRequest && (
        <div style={styles.incomingNotice}>
          <ArrowUpRight size={14} />
          <span>{user.name} already requested a swap with you.</span>
        </div>
      )}

      {/* Settled relationships are stated, not actioned. These only turn up when
          browsing the directory; the recommendation feed filters them out. */}
      {settledLabel ? (
        <div style={styles.settledState}>{settledLabel}</div>
      ) : (
        <div style={styles.actions}>
          {onPass && (
            <button
              onClick={() => onPass(recommendation)}
              className="btn btn-danger"
              style={styles.actionBtn}
              disabled={isProcessing}
            >
              <X size={18} />
              <span>{isIncomingRequest ? 'Decline' : 'Pass'}</span>
            </button>
          )}

          <button
            onClick={() => onAccept(recommendation)}
            className="btn btn-primary"
            style={{ ...styles.actionBtn, ...styles.acceptBtn }}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <RefreshCw size={18} className="spin-icon" />
            ) : (
              <Check size={18} />
            )}
            <span>{isIncomingRequest ? 'Accept Request' : 'Swap Skills'}</span>
          </button>
        </div>
      )}
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
    flexDirection: 'column',
    gap: '10px',
    background: 'rgba(6, 182, 212, 0.06)',
    border: '1px solid rgba(6, 182, 212, 0.18)',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  mutualBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--secondary)',
    fontWeight: '700',
  },
  matchLine: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  matchLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
  },
  matchBadges: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  settledState: {
    marginTop: '10px',
    padding: '12px',
    textAlign: 'center',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px dashed var(--glass-border)',
    color: 'var(--text-secondary)',
    fontSize: '13px',
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
  incomingNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.25)',
    color: '#c084fc',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
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
