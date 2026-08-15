import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

const SERVER_URL = 'http://localhost:5050';
const API_BASE = `${SERVER_URL}/api`;

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);

  // Data States
  const [recommendations, setRecommendations] = useState([]);
  const [matches, setMatches] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  // Users the current session has passed on. Kept client-side so a refetch
  // (e.g. after a socket event) does not bring the dismissed cards back.
  const [dismissedUserIds, setDismissedUserIds] = useState([]);
  // Browse directory
  const [searchResults, setSearchResults] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [skillCatalog, setSkillCatalog] = useState({ skills: [], interests: [] });
  const socketRef = useRef(null);

  // UI / Loading States
  const [error, setError] = useState('');
  const [matchError, setMatchError] = useState('');
  const [recommendationsError, setRecommendationsError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const userId = user ? user.id : null;

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
    } catch {
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
    } catch {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    // Clear session data here rather than in an effect, so no stale profile
    // data can flash if another account logs in next.
    setRecommendations([]);
    setMatches([]);
    setPendingRequests([]);
    setNotifications([]);
    setDismissedUserIds([]);
    setSearchResults([]);
    setSkillCatalog({ skills: [], interests: [] });
    setSearchTotal(0);
    setSearchPage(1);
    setSearchTotalPages(1);
    setError('');
    setMatchError('');
    setRecommendationsError('');
    setSearchError('');
    // The socket effect's cleanup disconnects once userId becomes null.
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
        // Editing skills can introduce brand new tags into the directory
        fetchSkillCatalog();
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
        setRecommendationsError('');
      } else {
        // e.g. 503 when the Python ML service is not running
        setRecommendations([]);
        setRecommendationsError(data.error || 'Could not load recommendations.');
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setRecommendationsError('Cannot reach the server. Is the backend running?');
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

  // Directory search. Filters are passed in explicitly by BrowseDirectory so
  // App does not need to mirror that component's form state.
  const searchUsers = async ({ q = '', skill = '', interest = '', page = 1 } = {}) => {
    setLoadingSearch(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (q) params.set('q', q);
      if (skill) params.set('skill', skill);
      if (interest) params.set('interest', interest);

      const res = await fetch(`${API_BASE}/users/search?${params}`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.results);
        setSearchPage(data.page);
        setSearchTotalPages(data.totalPages);
        setSearchTotal(data.total);
        setSearchError('');
      } else {
        setSearchResults([]);
        setSearchError(data.error || 'Search failed.');
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchError('Cannot reach the server. Please try again.');
    } finally {
      setLoadingSearch(false);
    }
  };

  const fetchSkillCatalog = async () => {
    try {
      const res = await fetch(`${API_BASE}/skills`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setSkillCatalog(data);
      }
    } catch (err) {
      console.error('Error loading skill catalog:', err);
    }
  };

  // ==========================================
  // Session Effects
  // (declared after the fetchers they call)
  // ==========================================

  // 1. Resolve the active user profile whenever a token is present.
  // set-state-in-effect is disabled on the fetch-on-mount effects below:
  // kicking off a request and flipping its loading flag is exactly what these
  // effects exist to do, and the app has no data-fetching library to defer to.
  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUserProfile();
    }
  }, [token]);

  // 2. Load dashboard data once a user session is established.
  // Keyed on the user id (not the user object) so saving a profile does not
  // tear down and rebuild the whole session.
  useEffect(() => {
    if (!userId) return;

    /* eslint-disable react-hooks/set-state-in-effect */
    fetchRecommendations();
    fetchMatches();
    fetchPendingRequests();
    fetchNotifications();
    fetchSkillCatalog();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [userId]);

  // 3. Socket.io listener integration.
  // One socket per logged-in user, torn down on logout/unmount so we never
  // leak connections or receive a notification twice.
  useEffect(() => {
    if (!userId) return;

    const s = io(SERVER_URL);
    socketRef.current = s;

    s.on('connect', () => {
      console.log('Real-time notification socket connected.');
      s.emit('register_user', userId);
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

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

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
    setMatchError('');
    try {
      const res = await fetch(`${API_BASE}/matches/request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ recipientId })
      });
      const data = await res.json();
      if (res.ok) {
        // Remove this user from explore recommendations feed locally
        setRecommendations(prev => prev.filter(r => r.user.id !== recipientId));
        // A browsed profile stays on screen, so update its state in place
        setSearchResults(prev => prev.map(r =>
          r.user.id === recipientId ? { ...r, matchStatus: 'pending_sent', matchId: null } : r
        ));
      } else {
        setMatchError(data.error || 'Could not send the swap request.');
      }
    } catch (err) {
      console.error('Error requesting match:', err);
      setMatchError('Cannot reach the server. Please try again.');
    } finally {
      setIsProcessingMatch(false);
    }
  };

  const handleRespondToMatch = async (matchId, action) => {
    setIsProcessingMatch(true);
    setMatchError('');
    try {
      const res = await fetch(`${API_BASE}/matches/respond`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ matchId, action })
      });
      const data = await res.json();
      if (res.ok) {
        // Refetch updates
        fetchPendingRequests();
        fetchMatches();
        fetchRecommendations();
        // The stored notification's match status changed, so refresh the bell too
        fetchNotifications();
        // Keep any browsed card showing this match in sync
        setSearchResults(prev => prev.map(r =>
          r.matchId && r.matchId === matchId
            ? { ...r, matchStatus: action === 'accept' ? 'accepted' : 'declined', matchId: null }
            : r
        ));
      } else {
        setMatchError(data.error || `Could not ${action} the request.`);
      }
    } catch (err) {
      console.error('Error responding to match:', err);
      setMatchError('Cannot reach the server. Please try again.');
    } finally {
      setIsProcessingMatch(false);
    }
  };

  // A recommendation card's primary action means different things depending on
  // whether this person has already requested a swap with us.
  const handleAcceptRecommendation = (recommendation) => {
    if (recommendation.matchStatus === 'pending_received' && recommendation.matchId) {
      return handleRespondToMatch(recommendation.matchId, 'accept');
    }
    return handleSendMatchRequest(recommendation.user.id);
  };

  // "Pass": decline an actual incoming request, otherwise just hide the card
  // for the rest of this session.
  const handlePassRecommendation = (recommendation) => {
    setDismissedUserIds(prev =>
      prev.includes(recommendation.user.id) ? prev : [...prev, recommendation.user.id]
    );
    if (recommendation.matchStatus === 'pending_received' && recommendation.matchId) {
      return handleRespondToMatch(recommendation.matchId, 'decline');
    }
    return Promise.resolve();
  };

  const visibleRecommendations = recommendations.filter(
    r => !dismissedUserIds.includes(r.user.id)
  );

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
          recommendations={visibleRecommendations}
          matches={matches}
          pendingRequests={pendingRequests}
          onUpdateProfile={handleUpdateProfile}
          onAcceptRecommendation={handleAcceptRecommendation}
          onPassRecommendation={handlePassRecommendation}
          onRespondToMatch={handleRespondToMatch}
          loadingRecommendations={loadingRecommendations}
          loadingMatches={loadingMatches}
          isSavingProfile={isSavingProfile}
          isProcessingMatch={isProcessingMatch}
          recommendationsError={recommendationsError}
          matchError={matchError}
          searchResults={searchResults}
          searchPage={searchPage}
          searchTotalPages={searchTotalPages}
          searchTotal={searchTotal}
          skillCatalog={skillCatalog}
          loadingSearch={loadingSearch}
          searchError={searchError}
          onSearch={searchUsers}
        />
      )}
    </div>
  );
}
