import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

const API_BASE = 'http://localhost:5050/api';
const SOCKET_URL = 'http://localhost:5555'; // Socket falls back to default server port 5050

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  
  // Data States
  const [recommendations, setRecommendations] = useState([]);
  const [matches, setMatches] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  // UI / Loading States
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // 1. Initialize Active User Profile on startup/token load
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setUser(null);
    }
  }, [token]);

  // 2. Fetch dependencies when user profiles load
  useEffect(() => {
    if (user) {
      fetchRecommendations();
      fetchMatches();
      fetchPendingRequests();
      fetchNotifications();
      initializeSocket();
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setRecommendations([]);
      setMatches([]);
      setPendingRequests([]);
      setNotifications([]);
    }
  }, [user]);

  // 3. Socket.io Listener Integration
  const initializeSocket = () => {
    const s = io('http://localhost:5050');
    
    s.on('connect', () => {
      console.log('Real-time notification socket connected.');
      s.emit('register_user', user.id);
    });

    s.on('notification', (newNotif) => {
      console.log('New real-time notification received:', newNotif);
      setNotifications(prev => [newNotif, ...prev]);

      // Refetch relevant dashboard data depending on notification action
      if (newNotif.type === 'match_request') {
        fetchPendingRequests();
        fetchRecommendations();
      } else if (newNotif.type === 'match_accept') {
        fetchMatches();
        fetchRecommendations();
      }
    });

    setSocket(s);
  };

  // Helper Headers
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // ==========================================
  // API Call Handlers
  // ==========================================

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/profile`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        // Token expired or invalid
        handleLogout();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleLogin = async (email, password) => {
    setIsProcessing(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch (err) {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async (name, email, password) => {
    setIsProcessing(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    if (socket) {
      socket.disconnect();
    }
  };

  const handleUpdateProfile = async (profileData) => {
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        // Refresh recommendations immediately
        fetchRecommendations();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const res = await fetch(`${API_BASE}/recommendations`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchMatches = async () => {
    setLoadingMatches(true);
    try {
      const res = await fetch(`${API_BASE}/matches`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setMatches(data);
      }
    } catch (err) {
      console.error('Error loading matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/matches/pending`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setPendingRequests(data);
      }
    } catch (err) {
      console.error('Error loading pending requests:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await fetch(`${API_BASE}/notifications/read`, {
        method: 'PUT',
        headers: getHeaders()
      });
      // Mark all read in state locally
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const handleSendMatchRequest = async (recipientId) => {
    setIsProcessingMatch(true);
    try {
      const res = await fetch(`${API_BASE}/matches/request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ recipientId })
      });
      if (res.ok) {
        // Remove this user from explore recommendations feed locally
        setRecommendations(prev => prev.filter(r => r.user.id !== recipientId));
      }
    } catch (err) {
      console.error('Error requesting match:', err);
    } finally {
      setIsProcessingMatch(false);
    }
  };

  const handleRespondToMatch = async (matchId, action) => {
    setIsProcessingMatch(true);
    try {
      const res = await fetch(`${API_BASE}/matches/respond`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ matchId, action })
      });
      if (res.ok) {
        // Refetch updates
        fetchPendingRequests();
        fetchMatches();
        fetchRecommendations();
      }
    } catch (err) {
      console.error('Error responding to match:', err);
    } finally {
      setIsProcessingMatch(false);
    }
  };

  return (
    <div>
      <Navbar 
        user={user} 
        notifications={notifications} 
        onLogout={handleLogout}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onRespondToMatch={handleRespondToMatch}
      />
      
      {!user ? (
        <Auth 
          onLogin={handleLogin} 
          onRegister={handleRegister} 
          error={error} 
          isProcessing={isProcessing} 
        />
      ) : (
        <Dashboard 
          user={user}
          recommendations={recommendations}
          matches={matches}
          pendingRequests={pendingRequests}
          onUpdateProfile={handleUpdateProfile}
          onSendMatchRequest={handleSendMatchRequest}
          onRespondToMatch={handleRespondToMatch}
          loadingRecommendations={loadingRecommendations}
          loadingMatches={loadingMatches}
          isSavingProfile={isSavingProfile}
          isProcessingMatch={isProcessingMatch}
        />
      )}
    </div>
  );
}
