import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, User as UserIcon, Check, X, Award, HelpCircle } from 'lucide-react';

export default function Navbar({ user, notifications, onLogout, onMarkNotificationsRead, onRespondToMatch }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      onMarkNotificationsRead();
    }
  };

  const handleAction = async (matchId, action, notificationId) => {
    await onRespondToMatch(matchId, action);
    setShowNotifications(false);
  };

  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.container}>
        <div style={styles.logoGroup}>
          <div style={styles.logoIcon}>↔</div>
          <span style={styles.logoText}>Skill<span style={{ color: 'var(--secondary)' }}>Swap</span></span>
        </div>

        {user && (
          <div style={styles.navActions}>
            <div style={styles.userInfo}>
              <UserIcon size={16} color="var(--secondary)" />
              <span style={styles.userName}>{user.name}</span>
            </div>

            {/* Notification Bell */}
            <div style={styles.bellContainer} ref={dropdownRef}>
              <button 
                onClick={handleBellClick} 
                style={styles.bellBtn}
                title="Notifications"
                id="notification-bell"
              >
                <Bell size={20} className={unreadCount > 0 ? 'bell-ring' : ''} color={unreadCount > 0 ? 'var(--secondary)' : 'var(--text-secondary)'} />
                {unreadCount > 0 && (
                  <span style={styles.badge}>{unreadCount}</span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="glass-card" style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <span style={styles.unreadTag}>{unreadCount} new</span>
                    )}
                  </div>
                  <div style={styles.dropdownContent}>
                    {notifications.length === 0 ? (
                      <div style={styles.emptyState}>No notifications yet</div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n._id} 
                          style={{
                            ...styles.notificationItem,
                            backgroundColor: n.read ? 'transparent' : 'rgba(139, 92, 246, 0.05)'
                          }}
                        >
                          <p style={styles.notificationText}>{n.message}</p>
                          
                          {/* If it is a match request, show fast action buttons directly in notification! */}
                          {n.type === 'match_request' && (
                            <div style={styles.notificationActions}>
                              <button 
                                onClick={() => handleAction(n.match, 'accept', n._id)}
                                style={{ ...styles.actionBtn, ...styles.acceptBtn }}
                                title="Accept Request"
                              >
                                <Check size={14} /> Accept
                              </button>
                              <button 
                                onClick={() => handleAction(n.match, 'decline', n._id)}
                                style={{ ...styles.actionBtn, ...styles.declineBtn }}
                                title="Decline Request"
                              >
                                <X size={14} /> Decline
                              </button>
                            </div>
                          )}
                          <span style={styles.notificationTime}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={onLogout} className="btn btn-secondary" style={styles.logoutBtn}>
              <LogOut size={16} />
              <span className="logout-text">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    height: '70px',
    borderBottom: '1px solid var(--glass-border)',
    background: 'rgba(11, 15, 25, 0.8)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  logoIcon: {
    fontSize: '24px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '-0.03em',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.03)',
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid var(--glass-border)',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  bellContainer: {
    position: 'relative',
  },
  bellBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  badge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: 'var(--danger)',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
  },
  logoutBtn: {
    padding: '8px 16px',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '45px',
    width: '320px',
    maxHeight: '400px',
    overflowY: 'auto',
    zIndex: 110,
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '10px',
    marginBottom: '10px',
  },
  unreadTag: {
    fontSize: '11px',
    background: 'var(--primary)',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: 'bold',
  },
  dropdownContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  emptyState: {
    padding: '30px 0',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  notificationItem: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  notificationText: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    lineHeight: '1.4',
  },
  notificationTime: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    alignSelf: 'flex-end',
  },
  notificationActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  actionBtn: {
    flex: 1,
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 'bold',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
  },
  acceptBtn: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
  },
  declineBtn: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#f87171',
  }
};
