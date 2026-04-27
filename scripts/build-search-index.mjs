import {createHash} from 'node:crypto';
import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {dirname, extname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import * as sqliteVec from 'sqlite-vec';
import {SEARCH_VECTOR_DIMS, embedText} from '../shared/search/embedding.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDirectory, '..');
const docsDirectory = join(projectRoot, 'docs');
const outputDirectory = join(projectRoot, 'static', 'search');
const sqliteOutputPath = join(outputDirectory, 'search-index.sqlite');
const jsonOutputPath = join(outputDirectory, 'search-index.json');
const manifestOutputPath = join(outputDirectory, 'search-index.manifest.json');
const sqliteWasmRuntimeDirectory = join(projectRoot, 'node_modules', 'sqlite-wasm-vec');
const sqliteWasmModuleSourcePath = join(sqliteWasmRuntimeDirectory, 'index.mjs');
const sqliteWasmDirectorySourcePath = join(sqliteWasmRuntimeDirectory, 'sqlite-wasm');
const sqliteWasmOutputDirectory = join(outputDirectory, 'sqlite-wasm-vec');
const sqliteWasmModuleOutputPath = join(sqliteWasmOutputDirectory, 'index.mjs');
const sqliteWasmDirectoryOutputPath = join(sqliteWasmOutputDirectory, 'sqlite-wasm');
const legacyWasmModuleOutputPath = join(outputDirectory, 'sqlite3.mjs');
const legacyWasmBinaryOutputPath = join(outputDirectory, 'sqlite3.wasm');

const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

function listDocsFiles(directoryPath) {
  const directoryEntries = readdirSync(directoryPath, {withFileTypes: true});
  const files = [];

  for (const entry of directoryEntries) {
    const entryPath = join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...listDocsFiles(entryPath));
      continue;
    }

    if (!MARKDOWN_EXTENSIONS.has(extname(entry.name))) {
      continue;
    }

    files.push(entryPath);
  }

  return files.sort();
}

function parseFrontmatter(rawDocument) {
  const frontmatterMatch = rawDocument.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!frontmatterMatch) {
    return {frontmatter: {}, body: rawDocument};
  }

  const frontmatter = {};
  frontmatterMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes(':'))
    .forEach((line) => {
      const separatorIndex = line.indexOf(':');
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

      if (key) {
        frontmatter[key] = value;
      }
    });

  return {
    frontmatter,
    body: rawDocument.slice(frontmatterMatch[0].length),
  };
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, ' $1 ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, ' $1 ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^>\s?/gm, ' ')
    .replace(/^#{1,6}\s+/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/[~*_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleFromBody(markdownBody) {
  const headingMatch = markdownBody.match(/^#\s+(.+)$/m);
  return headingMatch ? headingMatch[1].trim() : '';
}

function normalizeDocsUrl(urlPath) {
  const withLeadingSlash = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  const normalized = withLeadingSlash
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');

  return normalized || '/docs';
}

function deriveDocUrl(relativeDocPath, frontmatterSlug) {
  const withoutExtension = relativeDocPath.replace(/\.(md|mdx)$/i, '').replace(/\\/g, '/');
  const pathSegments = withoutExtension.split('/').filter(Boolean);
  const fileName = pathSegments[pathSegments.length - 1] || '';
  const directory = pathSegments.slice(0, -1).join('/');

  if (frontmatterSlug) {
    if (frontmatterSlug.startsWith('/')) {
      return normalizeDocsUrl(`/docs${frontmatterSlug}`);
    }

    return normalizeDocsUrl(`/docs/${directory ? `${directory}/` : ''}${frontmatterSlug}`);
  }

  if (withoutExtension === 'intro') {
    return '/docs';
  }

  if (fileName === 'index') {
    return normalizeDocsUrl(`/docs/${directory}`);
  }

  return normalizeDocsUrl(`/docs/${withoutExtension}`);
}

function docSection(relativeDocPath) {
  const [topLevel] = relativeDocPath.split('/');
  return topLevel || 'general';
}

function createPreview(plainText, maxLength = 220) {
  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trimEnd()}…`;
}

function writeJsonFile(targetPath, value) {
  writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function ensureOutputDirectory() {
  mkdirSync(outputDirectory, {recursive: true});
}

function copySqliteWasmRuntime() {
  if (!existsSync(sqliteWasmModuleSourcePath) || !existsSync(sqliteWasmDirectorySourcePath)) {
    throw new Error(
      'sqlite-wasm-vec runtime files are missing. Run `npm install` before building search index.',
    );
  }

  rmSync(sqliteWasmOutputDirectory, {recursive: true, force: true});
  rmSync(legacyWasmModuleOutputPath, {force: true});
  rmSync(legacyWasmBinaryOutputPath, {force: true});

  mkdirSync(sqliteWasmOutputDirectory, {recursive: true});
  copyFileSync(sqliteWasmModuleSourcePath, sqliteWasmModuleOutputPath);
  cpSync(sqliteWasmDirectorySourcePath, sqliteWasmDirectoryOutputPath, {recursive: true});
}

function buildDocuments() {
  const documentFiles = listDocsFiles(docsDirectory);

  return documentFiles.map((absolutePath, index) => {
    const relativePath = relative(docsDirectory, absolutePath).replace(/\\/g, '/');
    const rawDocument = readFileSync(absolutePath, 'utf8');
    const {frontmatter, body} = parseFrontmatter(rawDocument);
    const title =
      frontmatter.title ||
      titleFromBody(body) ||
      relativePath.replace(/\.(md|mdx)$/i, '').split('/').pop();

    const plainText = stripMarkdown(body).slice(0, 12000);
    const content = plainText.slice(0, 6000);
    const combinedText = `${title}\n${content}`;
    const embedding = embedText(combinedText, SEARCH_VECTOR_DIMS);

    return {
      id: index + 1,
      title,
      slug: deriveDocUrl(relativePath, frontmatter.slug),
      section: docSection(relativePath),
      sourcePath: relativePath,
      preview: createPreview(plainText),
      content,
      embedding,
    };
  });
}

function buildSqliteIndex(records) {
  rmSync(sqliteOutputPath, {force: true});

  const database = new DatabaseSync(sqliteOutputPath, {allowExtension: true});
  sqliteVec.load(database);

  database.exec(`
    PRAGMA journal_mode = DELETE;
    PRAGMA synchronous = OFF;
    PRAGMA temp_store = MEMORY;

    CREATE TABLE docs (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      section TEXT NOT NULL,
      source_path TEXT NOT NULL,
      preview TEXT NOT NULL,
      content TEXT NOT NULL
    );

    CREATE INDEX idx_docs_section ON docs(section);

    CREATE VIRTUAL TABLE docs_vec USING vec0(
      embedding float[${SEARCH_VECTOR_DIMS}]
    );

    CREATE VIRTUAL TABLE docs_fts USING fts5(
      doc_id UNINDEXED,
      title,
      content,
      slug,
      section
    );

    CREATE TABLE metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const insertDoc = database.prepare(`
    INSERT INTO docs (id, title, slug, section, source_path, preview, content)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVector = database.prepare(`
    INSERT INTO docs_vec (rowid, embedding)
    VALUES (?, ?)
  `);

  const insertFts = database.prepare(`
    INSERT INTO docs_fts (doc_id, title, content, slug, section)
    VALUES (?, ?, ?, ?, ?)
  `);

  database.exec('BEGIN');

  try {
    for (const record of records) {
      insertDoc.run(
        record.id,
        record.title,
        record.slug,
        record.section,
        record.sourcePath,
        record.preview,
        record.content,
      );

      insertVector.run(
        BigInt(record.id),
        new Uint8Array(new Float32Array(record.embedding).buffer),
      );

      insertFts.run(
        record.id,
        record.title,
        record.content,
        record.slug,
        record.section,
      );
    }

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    database.close();
    throw error;
  }

  const metadataEntry = database.prepare('INSERT INTO metadata(key, value) VALUES (?, ?)');
  metadataEntry.run('vectorDimensions', String(SEARCH_VECTOR_DIMS));
  metadataEntry.run('recordCount', String(records.length));
  metadataEntry.run('generatedAt', new Date().toISOString());

  database.close();
}

function writeJsonIndex(records) {
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    vectorDimensions: SEARCH_VECTOR_DIMS,
    sourceCount: records.length,
    records,
  };

  writeJsonFile(jsonOutputPath, payload);

  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  writeJsonFile(manifestOutputPath, {
    generatedAt: payload.generatedAt,
    vectorDimensions: payload.vectorDimensions,
    sourceCount: payload.sourceCount,
    files: {
      json: 'search-index.json',
      sqlite: 'search-index.sqlite',
      wasmModule: 'sqlite-wasm-vec/index.mjs',
      wasmDirectory: 'sqlite-wasm-vec/sqlite-wasm',
    },
    sha256: hash,
  });
}

function main() {
  ensureOutputDirectory();
  const records = buildDocuments();

  if (!records.length) {
    throw new Error('No markdown documents found to index.');
  }

  copySqliteWasmRuntime();
  buildSqliteIndex(records);
  writeJsonIndex(records);

  process.stdout.write(
    `Built search index for ${records.length} docs.\n` +
      `- ${relative(projectRoot, jsonOutputPath)}\n` +
      `- ${relative(projectRoot, sqliteOutputPath)}\n` +
      `- ${relative(projectRoot, sqliteWasmModuleOutputPath)}\n` +
      `- ${relative(projectRoot, sqliteWasmDirectoryOutputPath)}\n`,
  );
}

main();
