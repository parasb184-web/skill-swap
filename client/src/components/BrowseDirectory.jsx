import { useState, useEffect } from 'react';
import { Search, X, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import MatchCard from './MatchCard';

// How many filter chips to offer before the "show all" toggle
const CHIP_LIMIT = 12;

export default function BrowseDirectory({
  results,
  page,
  totalPages,
  total,
  catalog,
  isLoading,
  error,
  onSearch,
  onAccept,
  isProcessingMatch
}) {
  const [term, setTerm] = useState('');
  const [skill, setSkill] = useState('');
  const [interest, setInterest] = useState('');
  const [showAllChips, setShowAllChips] = useState(false);

  // Run the initial (unfiltered) listing once when the tab first mounts
  useEffect(() => {
    onSearch({ q: '', skill: '', interest: '', page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = (overrides = {}) => {
    onSearch({ q: term, skill, interest, page: 1, ...overrides });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch();
  };

  // Selecting a chip replaces the current filter, clicking it again clears it
  const toggleSkill = (name) => {
    const next = skill === name ? '' : name;
    setSkill(next);
    setInterest('');
    onSearch({ q: term, skill: next, interest: '', page: 1 });
  };

  const toggleInterest = (name) => {
    const next = interest === name ? '' : name;
    setInterest(next);
    setSkill('');
    onSearch({ q: term, skill: '', interest: next, page: 1 });
  };

  const clearAll = () => {
    setTerm('');
    setSkill('');
    setInterest('');
    onSearch({ q: '', skill: '', interest: '', page: 1 });
  };

  const goToPage = (next) => {
    onSearch({ q: term, skill, interest, page: next });
  };

  const hasFilters = Boolean(term || skill || interest);
  const skillChips = showAllChips ? catalog.skills : catalog.skills.slice(0, CHIP_LIMIT);
  const interestChips = showAllChips ? catalog.interests : catalog.interests.slice(0, CHIP_LIMIT);

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSubmit} style={styles.searchRow}>
        <div style={styles.searchInputWrap}>
          <Search size={16} color="var(--text-muted)" style={styles.searchIcon} />
          <input
            type="text"
            className="glass-input"
            style={styles.searchInput}
            placeholder="Search by name, bio, or skill…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            aria-label="Search people"
          />
          {term && (
            <button type="button" onClick={() => setTerm('')} style={styles.clearInputBtn} title="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
        <button type="submit" className="btn btn-primary" style={styles.searchBtn} disabled={isLoading}>
          {isLoading ? <RefreshCw size={16} className="spin-icon" /> : <Search size={16} />}
          <span>Search</span>
        </button>
      </form>

      {/* Filter chips */}
      <div className="glass-card" style={styles.filterPanel}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Teaches</span>
          <div style={styles.chipRow}>
            {skillChips.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => toggleSkill(s.name)}
                style={{ ...styles.chip, ...(skill === s.name ? styles.chipActiveTeach : {}) }}
              >
                {s.name} <span style={styles.chipCount}>{s.count}</span>
              </button>
            ))}
            {skillChips.length === 0 && <span style={styles.emptyChips}>No skills listed yet</span>}
          </div>
        </div>

        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Wants to learn</span>
          <div style={styles.chipRow}>
            {interestChips.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => toggleInterest(s.name)}
                style={{ ...styles.chip, ...(interest === s.name ? styles.chipActiveLearn : {}) }}
              >
                {s.name} <span style={styles.chipCount}>{s.count}</span>
              </button>
            ))}
            {interestChips.length === 0 && <span style={styles.emptyChips}>No interests listed yet</span>}
          </div>
        </div>

        <div style={styles.filterFooter}>
          {(catalog.skills.length > CHIP_LIMIT || catalog.interests.length > CHIP_LIMIT) && (
            <button type="button" onClick={() => setShowAllChips(!showAllChips)} style={styles.linkBtn}>
              {showAllChips ? 'Show fewer tags' : 'Show all tags'}
            </button>
          )}
          {hasFilters && (
            <button type="button" onClick={clearAll} style={styles.linkBtn}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div style={styles.resultsHeader}>
        <span style={styles.resultsCount}>
          {isLoading ? 'Searching…' : `${total} ${total === 1 ? 'person' : 'people'} found`}
        </span>
        {totalPages > 1 && (
          <span style={styles.pageIndicator}>Page {page} of {totalPages}</span>
        )}
      </div>

      {/* Results */}
      {error ? (
        <div className="glass-card" style={styles.emptyState}>
          <AlertCircle size={32} color="var(--danger)" />
          <h3>Search unavailable</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{error}</p>
        </div>
      ) : isLoading && results.length === 0 ? (
        <div style={styles.loadingState}>
          <RefreshCw size={24} className="spin-icon" color="var(--secondary)" />
          <p>Searching the directory…</p>
        </div>
      ) : results.length === 0 ? (
        <div className="glass-card" style={styles.emptyState}>
          <Users size={32} color="var(--text-muted)" />
          <h3>Nobody matches that search</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Try a different term, or clear the filters to see everyone.
          </p>
        </div>
      ) : (
        <div style={styles.cardList}>
          {results.map((r) => (
            <MatchCard
              key={r.user.id}
              recommendation={r}
              onAccept={onAccept}
              isProcessing={isProcessingMatch}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            type="button"
            className="btn btn-secondary"
            style={styles.pageBtn}
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1 || isLoading}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={styles.pageIndicator}>{page} / {totalPages}</span>
          <button
            type="button"
            className="btn btn-secondary"
            style={styles.pageBtn}
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages || isLoading}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  searchRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  searchInputWrap: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    pointerEvents: 'none',
  },
  searchInput: {
    paddingLeft: '38px',
    paddingRight: '34px',
  },
  clearInputBtn: {
    position: 'absolute',
    right: '10px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  searchBtn: {
    padding: '12px 20px',
  },
  filterPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '18px',
    marginBottom: '20px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--glass-border)',
    borderRadius: '20px',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    fontWeight: '600',
    padding: '5px 12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  chipActiveTeach: {
    background: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.5)',
    color: 'var(--secondary)',
  },
  chipActiveLearn: {
    background: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
    color: '#c084fc',
  },
  chipCount: {
    fontSize: '10px',
    opacity: 0.65,
  },
  emptyChips: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  filterFooter: {
    display: 'flex',
    gap: '16px',
  },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--secondary)',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
  },
  resultsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  resultsCount: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
  },
  pageIndicator: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '24px',
  },
  pageBtn: {
    padding: '8px 16px',
    fontSize: '13px',
  },
};
