import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './search.module.css';
import {searchDocs} from '../search/client';

export default function SearchPage() {
  const indexUrl = useBaseUrl('/search/search-index.json');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [runtime, setRuntime] = useState({recordCount: 0, generatedAt: null});
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const resultLabel = useMemo(() => {
    if (!results.length) {
      return 'No results yet';
    }

    return `${results.length} result${results.length === 1 ? '' : 's'}`;
  }, [results]);

  const runSearch = useCallback(
    async (incomingQuery, {replaceState = true} = {}) => {
      const nextQuery = String(incomingQuery || '').trim();

      if (!nextQuery) {
        setStatus('idle');
        setResults([]);
        setError('');
        setElapsedMs(0);

        if (replaceState && typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/search');
        }

        return;
      }

      setStatus('loading');
      setError('');

      try {
        const payload = await searchDocs({
          query: nextQuery,
          indexUrl,
          limit: 12,
        });

        setResults(payload.results);
        setElapsedMs(payload.elapsedMs);
        setRuntime(payload.runtime);
        setStatus('done');

        if (replaceState && typeof window !== 'undefined') {
          window.history.replaceState({}, '', `/search?q=${encodeURIComponent(nextQuery)}`);
        }
      } catch (searchError) {
        setStatus('error');
        setError(searchError.message || 'Search failed.');
      }
    },
    [indexUrl],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const presetQuery = url.searchParams.get('q') || '';

    if (!presetQuery) {
      return;
    }

    setQuery(presetQuery);
    runSearch(presetQuery, {replaceState: false});
  }, [runSearch]);

  function onSubmit(event) {
    event.preventDefault();
    runSearch(query);
  }

  return (
    <Layout title="Search" description="Search Digital Church Team documentation">
      <main className={styles.page}>
        <section className={styles.container}>
          <h1 className={styles.title}>Search Documentation</h1>
          <p className={styles.subtitle}>
            sqlite-vec powered local index. No Algolia required.
          </p>

          <form className={styles.form} onSubmit={onSubmit}>
            <input
              className={styles.input}
              type="search"
              placeholder="Try: beaver builder branding"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
            <button className={styles.button} type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Searching…' : 'Search'}
            </button>
          </form>

          <div className={styles.meta}>
            <span>{resultLabel}</span>
            <span>{elapsedMs ? `${elapsedMs.toFixed(1)} ms` : '—'}</span>
            <span>{runtime.recordCount ? `${runtime.recordCount} indexed docs` : 'Index not loaded yet'}</span>
          </div>

          {status === 'error' ? <p className={styles.error}>{error}</p> : null}

          <ul className={styles.results}>
            {results.map((result) => (
              <li key={result.id} className={styles.card}>
                <a className={styles.resultLink} href={result.slug}>
                  {result.title}
                </a>
                <p className={styles.resultMeta}>{result.section}</p>
                <p className={styles.resultSnippet}>{result.snippet || result.preview}</p>
              </li>
            ))}
          </ul>

          {runtime.generatedAt ? (
            <p className={styles.generatedAt}>
              Index generated: {new Date(runtime.generatedAt).toLocaleString()}
            </p>
          ) : null}
        </section>
      </main>
    </Layout>
  );
}
