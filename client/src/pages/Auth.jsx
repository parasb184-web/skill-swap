import React, { useState } from 'react';

export default function Auth({ onLogin, onRegister, error, isProcessing }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setName('');
    setEmail('');
    setPassword('');
    setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const formattedEmail = email.trim().toLowerCase();
    const formattedPassword = password.trim();

    if (!formattedEmail || !formattedPassword) {
      setValidationError('Please fill in all fields.');
      return;
    }

    if (!isLogin && !name.trim()) {
      setValidationError('Name is required.');
      return;
    }

    if (isLogin) {
      await onLogin(formattedEmail, formattedPassword);
    } else {
      await onRegister(name.trim(), formattedEmail, formattedPassword);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundBlur1}></div>
      <div style={styles.backgroundBlur2}></div>

      <div style={styles.cardContainer} className="anim-slide-up">
        {/* Brand Header */}
        <div style={styles.header}>
          <div style={styles.logoIcon}>↔</div>
          <h2 style={styles.logoText}>SkillSwap</h2>
          <p style={styles.tagline}>Exchange knowledge, build connections, grow together.</p>
        </div>

        {/* Form Container */}
        <div className="glass-card" style={styles.card}>
          {/* Tabs */}
          <div style={styles.tabs}>
            <button 
              type="button"
              onClick={() => !isLogin && toggleMode()} 
              style={{
                ...styles.tab,
                color: isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottomColor: isLogin ? 'var(--secondary)' : 'transparent',
              }}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => isLogin && toggleMode()} 
              style={{
                ...styles.tab,
                color: !isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottomColor: !isLogin ? 'var(--secondary)' : 'transparent',
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Name (Registration Only) */}
            {!isLogin && (
              <div style={styles.formGroup}>
                <label className="glass-label" htmlFor="register-name">Full Name</label>
                <input 
                  id="register-name"
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* Email */}
            <div style={styles.formGroup}>
              <label className="glass-label" htmlFor="auth-email">Email Address</label>
              <input 
                id="auth-email"
                type="email" 
                className="glass-input" 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={isProcessing}
              />
            </div>

            {/* Password */}
            <div style={styles.formGroup}>
              <label className="glass-label" htmlFor="auth-password">Password</label>
              <input 
                id="auth-password"
                type="password" 
                className="glass-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={isProcessing}
              />
            </div>

            {/* Errors */}
            {(validationError || error) && (
              <div style={styles.errorBox}>
                {validationError || error}
              </div>
            )}

            {/* Submit */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={styles.submitBtn}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Preset Helper */}
          {isLogin && (
            <div style={styles.presetsHelper}>
              <p style={styles.presetTitle}>Testing Accounts:</p>
              <code style={styles.code}>alice@skillswap.com / password123</code>
              <code style={styles.code}>bob@skillswap.com / password123</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - 70px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
  },
  backgroundBlur1: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: '300px',
    height: '300px',
    background: 'var(--primary)',
    filter: 'blur(120px)',
    opacity: 0.15,
    zIndex: -1,
  },
  backgroundBlur2: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
    width: '300px',
    height: '300px',
    background: 'var(--secondary)',
    filter: 'blur(120px)',
    opacity: 0.15,
    zIndex: -1,
  },
  cardContainer: {
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    fontSize: '28px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    boxShadow: '0 8px 16px rgba(6, 182, 212, 0.25)',
  },
  logoText: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#fff',
  },
  tagline: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  card: {
    padding: '32px 24px',
    boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6)',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--glass-border)',
    marginBottom: '24px',
  },
  tab: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    paddingBottom: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '13px',
    fontWeight: '500',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: '8px',
    height: '48px',
    fontSize: '16px',
  },
  presetsHelper: {
    marginTop: '20px',
    borderTop: '1px dashed var(--glass-border)',
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  presetTitle: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: 'bold',
  },
  code: {
    fontSize: '12px',
    background: 'rgba(0,0,0,0.3)',
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'var(--secondary)',
    fontFamily: 'monospace',
  }
};
