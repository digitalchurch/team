import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {searchDocs} from '@site/src/search/client';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './search-modal.module.css';

export default function SearchModal({isOpen, onClose}) {
  const indexUrl = useBaseUrl('/search/search-index.json');
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setStatus('idle');
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (event.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
        event.preventDefault();
        window.location.href = results[selectedIndex].slug;
        onClose();
      }
    },
    [onClose, results, selectedIndex],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const resultLabel = useMemo(() => {
    if (!results.length) {
      return status === 'loading' ? 'Searching...' : 'Type to search docs';
    }
    return `${results.length} result${results.length === 1 ? '' : 's'}`;
  }, [results.length, status]);

  const runSearch = useCallback(
    async (nextQuery) => {
      const trimmed = String(nextQuery || '').trim();

      if (!trimmed) {
        setResults([]);
        setStatus('idle');
        return;
      }

      setStatus('loading');

      try {
        const payload = await searchDocs({
          query: trimmed,
          indexUrl,
          limit: 8,
        });

        setResults(payload.results);
        setStatus('done');
      } catch {
        setStatus('error');
      }
    },
    [indexUrl],
  );

  const handleChange = (event) => {
    const value = event.target.value;
    setQuery(value);

    if (value.length >= 2) {
      runSearch(value);
    } else {
      setResults([]);
      setStatus('idle');
    }
  };

  const handleResultClick = (slug) => {
    window.location.href = slug;
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inputWrapper}>
          <svg
            className={styles.searchIcon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search documentation..."
            value={query}
            onChange={handleChange}
            autoComplete="off"
          />
          <kbd className={styles.kbd}>esc</kbd>
        </div>

        <div className={styles.meta}>
          <span>{resultLabel}</span>
        </div>

        <ul className={styles.results}>
          {results.map((result, index) => (
            <li key={result.id}>
              <button
                className={`${styles.resultButton} ${index === selectedIndex ? styles.selected : ''}`}
                onClick={() => handleResultClick(result.slug)}>
                <span className={styles.resultTitle}>{result.title}</span>
                <span className={styles.resultMeta}>{result.section}</span>
                <span className={styles.resultSnippet}>{result.snippet}</span>
              </button>
            </li>
          ))}
        </ul>

        {status === 'error' && (
          <p className={styles.error}>Search failed. Please try again.</p>
        )}

        <div className={styles.footer}>
          <span>
            <kbd>↵</kbd> to select
          </span>
          <span>
            <kbd>↑↓</kbd> to navigate
          </span>
          <span>
            <kbd>esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}