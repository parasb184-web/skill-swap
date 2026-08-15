import { useState } from 'react';
import { Plus, X, Award, HelpCircle, Save, Check } from 'lucide-react';

const POPULAR_SKILLS = [
  'Python', 'React', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 
  'UI/UX Design', 'Figma', 'CSS', 'HTML', 'Data Science', 'Machine Learning', 
  'Spanish', 'French', 'Public Speaking', 'Photography', 'Excel', 'Guitar', 'Piano'
];

export default function ProfileSetup({ user, onSave, isSaving }) {
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [skills, setSkills] = useState(user.skills || []);
  const [interests, setInterests] = useState(user.interests || []);
  const [customSkill, setCustomSkill] = useState('');
  const [customInterest, setCustomInterest] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAddSkill = (skill) => {
    const formatted = skill.trim();
    if (formatted && !skills.includes(formatted)) {
      setSkills([...skills, formatted]);
    }
  };

  const handleRemoveSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleAddInterest = (interest) => {
    const formatted = interest.trim();
    if (formatted && !interests.includes(formatted)) {
      setInterests([...interests, formatted]);
    }
  };

  const handleRemoveInterest = (interest) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    await onSave({ name, bio, skills, interests });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card anim-slide-up" style={styles.form}>
      <h3 style={styles.title}>Edit Profile</h3>
      <p style={styles.subtitle}>List your teaching skills and learning goals to help our ML engine find compatible matches.</p>

      {/* Name */}
      <div style={styles.formGroup}>
        <label className="glass-label" htmlFor="profile-name">Full Name</label>
        <input 
          id="profile-name"
          type="text" 
          className="glass-input" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          placeholder="e.g. Jane Doe"
        />
      </div>

      {/* Bio */}
      <div style={styles.formGroup}>
        <label className="glass-label" htmlFor="profile-bio">Bio / Background</label>
        <textarea 
          id="profile-bio"
          className="glass-input" 
          style={styles.textarea}
          value={bio} 
          onChange={(e) => setBio(e.target.value)} 
          rows={3}
          maxLength={300}
          placeholder="Briefly describe what you do, what you are looking to teach, and your goals..."
        />
        <span style={styles.charCount}>{300 - bio.length} characters left</span>
      </div>

      {/* Skills to Teach */}
      <div style={styles.formGroup}>
        <div style={styles.sectionHeader}>
          <Award size={16} color="var(--secondary)" />
          <label className="glass-label" style={{ margin: 0 }}>Skills I Can Teach</label>
        </div>
        <div style={styles.tagsContainer}>
          {skills.map((skill, index) => (
            <span key={index} className="badge badge-teach" style={styles.editableBadge}>
              {skill}
              <button type="button" onClick={() => handleRemoveSkill(skill)} style={styles.removeBadgeBtn}>
                <X size={10} />
              </button>
            </span>
          ))}
          {skills.length === 0 && <span style={styles.emptyText}>Add some skills you can share...</span>}
        </div>
        
        {/* Custom Skill Input */}
        <div style={styles.addInputGroup}>
          <input 
            type="text" 
            className="glass-input" 
            style={styles.addInput}
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            placeholder="Add custom skill..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill(customSkill);
                setCustomSkill('');
              }
            }}
          />
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={styles.addBtn}
            onClick={() => {
              handleAddSkill(customSkill);
              setCustomSkill('');
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Popular presets */}
        <div style={styles.presets}>
          <span style={styles.presetLabel}>Suggestions:</span>
          <div style={styles.presetList}>
            {POPULAR_SKILLS.filter(s => !skills.includes(s)).slice(0, 8).map((skill, idx) => (
              <button 
                key={idx} 
                type="button" 
                onClick={() => handleAddSkill(skill)}
                style={styles.presetBtn}
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interests to Learn */}
      <div style={styles.formGroup}>
        <div style={styles.sectionHeader}>
          <HelpCircle size={16} color="var(--primary)" />
          <label className="glass-label" style={{ margin: 0 }}>Skills I Want to Learn</label>
        </div>
        <div style={styles.tagsContainer}>
          {interests.map((interest, index) => (
            <span key={index} className="badge badge-learn" style={styles.editableBadge}>
              {interest}
              <button type="button" onClick={() => handleRemoveInterest(interest)} style={styles.removeBadgeBtn}>
                <X size={10} />
              </button>
            </span>
          ))}
          {interests.length === 0 && <span style={styles.emptyText}>Add some subjects you want to study...</span>}
        </div>

        {/* Custom Interest Input */}
        <div style={styles.addInputGroup}>
          <input 
            type="text" 
            className="glass-input" 
            style={styles.addInput}
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            placeholder="Add custom interest..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddInterest(customInterest);
                setCustomInterest('');
              }
            }}
          />
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={styles.addBtn}
            onClick={() => {
              handleAddInterest(customInterest);
              setCustomInterest('');
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Popular presets */}
        <div style={styles.presets}>
          <span style={styles.presetLabel}>Suggestions:</span>
          <div style={styles.presetList}>
            {POPULAR_SKILLS.filter(s => !interests.includes(s)).slice(0, 8).map((interest, idx) => (
              <button 
                key={idx} 
                type="button" 
                onClick={() => handleAddInterest(interest)}
                style={styles.presetBtn}
              >
                + {interest}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={styles.submitContainer}>
        <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={isSaving}>
          <Save size={18} />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>

        {success && (
          <div style={styles.successMsg}>
            <Check size={14} />
            <span>Profile saved successfully!</span>
          </div>
        )}
      </div>
    </form>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignSelf: 'start',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '10px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  textarea: {
    resize: 'vertical',
    fontFamily: 'var(--font-family)',
  },
  charCount: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    alignSelf: 'flex-end',
    marginTop: '4px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    minHeight: '40px',
    padding: '8px',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.01)',
    marginBottom: '10px',
  },
  editableBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    paddingRight: '6px',
  },
  removeBadgeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    padding: '4px',
  },
  addInputGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  addInput: {
    flex: 1,
  },
  addBtn: {
    width: '45px',
    height: '45px',
    padding: 0,
  },
  presets: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  presetLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: 'bold',
  },
  presetList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  presetBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    color: 'var(--text-secondary)',
    fontSize: '11px',
    padding: '4px 10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  submitContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '10px',
  },
  submitBtn: {
    minWidth: '150px',
  },
  successMsg: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--success)',
    fontSize: '13px',
    fontWeight: '600',
  }
};
