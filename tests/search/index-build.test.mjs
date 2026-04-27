import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import * as sqliteVec from 'sqlite-vec';
import {embedText} from '../../shared/search/embedding.mjs';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(testDirectory, '..', '..');
const indexBuildScript = join(projectRoot, 'scripts', 'build-search-index.mjs');
const indexJsonPath = join(projectRoot, 'static', 'search', 'search-index.json');
const indexSqlitePath = join(projectRoot, 'static', 'search', 'search-index.sqlite');

test('search index build creates queryable sqlite-vec artifacts', () => {
  const runResult = spawnSync(process.execPath, [indexBuildScript], {
    cwd: projectRoot,
    encoding: 'utf8',
  });

  assert.equal(runResult.status, 0, runResult.stderr || runResult.stdout);
  assert.ok(existsSync(indexJsonPath), 'expected JSON index output file');
  assert.ok(existsSync(indexSqlitePath), 'expected sqlite index output file');

  const indexPayload = JSON.parse(readFileSync(indexJsonPath, 'utf8'));
  assert.ok(Array.isArray(indexPayload.records));
  assert.ok(indexPayload.records.length > 30, 'expected docs to be indexed');

  const database = new DatabaseSync(indexSqlitePath, {allowExtension: true});
  sqliteVec.load(database);

  const {count} = database.prepare('SELECT COUNT(*) AS count FROM docs').get();
  assert.equal(count, indexPayload.records.length);

  const queryEmbedding = new Uint8Array(new Float32Array(embedText('beaver builder branding settings')).buffer);
  const vectorRows = database
    .prepare(`
      SELECT d.slug, nearest.distance
      FROM (
        SELECT rowid, distance
        FROM docs_vec
        WHERE embedding MATCH ?
        ORDER BY distance
        LIMIT 10
      ) nearest
      JOIN docs d ON d.id = nearest.rowid
      ORDER BY nearest.distance
    `)
    .all(queryEmbedding);

  assert.ok(vectorRows.length > 0, 'expected vector search rows');
  assert.ok(
    vectorRows.some((row) => String(row.slug).includes('beaver-builder')),
    `expected at least one beaver-builder hit, got ${JSON.stringify(vectorRows)}`,
  );

  const ftsRows = database
    .prepare(`
      SELECT slug
      FROM docs_fts
      WHERE docs_fts MATCH ?
      LIMIT 5
    `)
    .all('beaver* OR builder*');

  assert.ok(ftsRows.length > 0, 'expected FTS matches for beaver/builder query');

  database.close();
});
