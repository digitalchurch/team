import {
  SEARCH_VECTOR_DIMS,
  embedText,
  tokenizeSearchText,
} from '@site/shared/search/embedding.mjs';

let runtimePromise;

async function loadSqliteModule() {
  const sqliteModule = await import(
    /* webpackIgnore: true */ '/search/sqlite-wasm-vec/index.mjs'
  );

  return sqliteModule.default;
}

function createFtsQuery(rawQuery) {
  const tokens = tokenizeSearchText(rawQuery).slice(0, 8);
  if (!tokens.length) {
    return '';
  }

  return tokens.map((token) => `${token.replace(/["']/g, '')}*`).join(' AND ');
}

function createSnippet(content, tokens) {
  if (!content) {
    return '';
  }

  const maxSnippetLength = 220;
  const normalized = content.replace(/\s+/g, ' ').trim();

  if (!tokens?.length) {
    return normalized.length > maxSnippetLength
      ? `${normalized.slice(0, maxSnippetLength).trimEnd()}…`
      : normalized;
  }

  const lower = normalized.toLowerCase();
  const target = tokens.find((token) => lower.includes(token));

  if (!target) {
    return normalized.length > maxSnippetLength
      ? `${normalized.slice(0, maxSnippetLength).trimEnd()}…`
      : normalized;
  }

  const matchIndex = lower.indexOf(target);
  const start = Math.max(0, matchIndex - Math.floor(maxSnippetLength / 3));
  const end = Math.min(normalized.length, start + maxSnippetLength);
  const snippet = normalized.slice(start, end).trim();

  return `${start > 0 ? '…' : ''}${snippet}${end < normalized.length ? '…' : ''}`;
}

function scoreKeywordRank(rank) {
  const safeRank = Number.isFinite(rank) ? Math.abs(rank) : 999;
  return 1 / (1 + safeRank);
}

function scoreVectorDistance(distance) {
  const safeDistance = Number.isFinite(distance) ? distance : 999;
  return 1 / (1 + safeDistance);
}

function mergeResults({vectorRows, keywordRows, query, limit}) {
  const queryLower = query.toLowerCase();
  const queryTokens = tokenizeSearchText(query);
  const byId = new Map();

  for (const row of vectorRows) {
    const id = Number(row.id);
    byId.set(id, {
      id,
      slug: row.slug,
      title: row.title,
      section: row.section,
      preview: row.preview,
      content: row.content,
      vectorDistance: Number(row.vector_distance),
      keywordRank: Number.POSITIVE_INFINITY,
      vectorScore: scoreVectorDistance(Number(row.vector_distance)),
      keywordScore: 0,
    });
  }

  for (const row of keywordRows) {
    const id = Number(row.id);
    const existing = byId.get(id);

    if (!existing) {
      byId.set(id, {
        id,
        slug: row.slug,
        title: row.title,
        section: row.section,
        preview: row.preview,
        content: row.content,
        vectorDistance: Number.POSITIVE_INFINITY,
        keywordRank: Number(row.keyword_rank),
        vectorScore: 0,
        keywordScore: scoreKeywordRank(Number(row.keyword_rank)),
      });
      continue;
    }

    existing.keywordRank = Number(row.keyword_rank);
    existing.keywordScore = scoreKeywordRank(Number(row.keyword_rank));
  }

  const combined = [...byId.values()]
    .map((row) => {
      const titleLower = String(row.title).toLowerCase();
      const exactTitleBoost = titleLower.includes(queryLower) ? 0.18 : 0;
      const tokenTitleBoost =
        queryTokens.length && queryTokens.some((token) => titleLower.includes(token)) ? 0.08 : 0;
      const phraseBoost =
        queryTokens.length > 1 && titleLower.includes(queryTokens.join(' ')) ? 0.22 : 0;

      const score =
        row.vectorScore * 0.45 +
        row.keywordScore * 0.55 +
        exactTitleBoost +
        tokenTitleBoost +
        phraseBoost;

      return {
        ...row,
        score,
        snippet: createSnippet(row.content || row.preview, queryTokens),
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      section: row.section,
      preview: row.preview,
      snippet: row.snippet,
      score: row.score,
      vectorDistance: row.vectorDistance,
      keywordRank: row.keywordRank,
    }));

  return combined;
}

async function loadRuntime(indexUrl) {
  const [sqlite3InitModule, indexResponse] = await Promise.all([loadSqliteModule(), fetch(indexUrl)]);

  if (!indexResponse.ok) {
    throw new Error(`Failed to load search index (${indexResponse.status})`);
  }

  const indexPayload = await indexResponse.json();
  const vectorDimensions = Number(indexPayload.vectorDimensions || SEARCH_VECTOR_DIMS);

  const sqlite3 = await sqlite3InitModule({});
  const db = new sqlite3.oo1.DB(':memory:');

  db.exec(`
    CREATE TABLE docs (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      section TEXT NOT NULL,
      preview TEXT NOT NULL,
      content TEXT NOT NULL
    );

    CREATE VIRTUAL TABLE docs_vec USING vec0(
      embedding float[${vectorDimensions}]
    );

    CREATE VIRTUAL TABLE docs_fts USING fts5(
      doc_id UNINDEXED,
      title,
      content,
      slug,
      section
    );
  `);

  const insertDoc = db.prepare(
    'INSERT INTO docs (id, title, slug, section, preview, content) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertVector = db.prepare('INSERT INTO docs_vec (rowid, embedding) VALUES (?, ?)');
  const insertFts = db.prepare(
    'INSERT INTO docs_fts (doc_id, title, content, slug, section) VALUES (?, ?, ?, ?, ?)',
  );

  for (const record of indexPayload.records || []) {
    insertDoc
      .bind(1, record.id)
      .bind(2, record.title)
      .bind(3, record.slug)
      .bind(4, record.section)
      .bind(5, record.preview)
      .bind(6, record.content)
      .stepReset();

    insertVector
      .bind(1, BigInt(record.id))
      .bind(2, new Float32Array(record.embedding).buffer)
      .stepReset();

    insertFts
      .bind(1, record.id)
      .bind(2, record.title)
      .bind(3, record.content)
      .bind(4, record.slug)
      .bind(5, record.section)
      .stepReset();
  }

  insertDoc.finalize();
  insertVector.finalize();
  insertFts.finalize();

  return {
    db,
    vectorDimensions,
    generatedAt: indexPayload.generatedAt,
    recordCount: Number(indexPayload.sourceCount || (indexPayload.records || []).length),
  };
}

async function getRuntime(indexUrl) {
  if (!runtimePromise) {
    runtimePromise = loadRuntime(indexUrl).catch((error) => {
      runtimePromise = undefined;
      throw error;
    });
  }

  return runtimePromise;
}

export async function searchDocs({query, indexUrl, limit = 10}) {
  const trimmedQuery = String(query || '').trim();
  if (!trimmedQuery) {
    return {
      query: '',
      total: 0,
      results: [],
      runtime: {recordCount: 0, generatedAt: null},
      elapsedMs: 0,
    };
  }

  const startedAt = performance.now();
  const runtime = await getRuntime(indexUrl);
  const vector = embedText(trimmedQuery, runtime.vectorDimensions);
  const queryBuffer = new Float32Array(vector).buffer;
  const vectorLimit = Math.max(6, limit * 3);

  const vectorRows = runtime.db.selectObjects(
    `
      SELECT
        d.id,
        d.slug,
        d.title,
        d.section,
        d.preview,
        d.content,
        nearest.distance AS vector_distance
      FROM (
        SELECT rowid, distance
        FROM docs_vec
        WHERE embedding MATCH ?
        ORDER BY distance
        LIMIT ${vectorLimit}
      ) nearest
      JOIN docs d ON d.id = nearest.rowid
      ORDER BY nearest.distance
    `,
    queryBuffer,
  );

  const keywordQuery = createFtsQuery(trimmedQuery);
  const keywordLimit = Math.max(6, limit * 3);
  const keywordRows = keywordQuery
    ? runtime.db.selectObjects(
        `
          SELECT
            d.id,
            d.slug,
            d.title,
            d.section,
            d.preview,
            d.content,
            bm25(docs_fts) AS keyword_rank
          FROM docs_fts
          JOIN docs d ON d.id = CAST(docs_fts.doc_id AS INTEGER)
          WHERE docs_fts MATCH ?
          ORDER BY keyword_rank
          LIMIT ${keywordLimit}
        `,
        keywordQuery,
      )
    : [];

  const results = mergeResults({
    vectorRows,
    keywordRows,
    query: trimmedQuery,
    limit,
  });

  return {
    query: trimmedQuery,
    total: results.length,
    results,
    runtime: {
      recordCount: runtime.recordCount,
      generatedAt: runtime.generatedAt,
    },
    elapsedMs: performance.now() - startedAt,
  };
}

export function resetSearchRuntime() {
  runtimePromise = undefined;
}
