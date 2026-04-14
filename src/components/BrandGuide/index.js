import React from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import {
  actionRoles,
  basePalette,
  componentPatterns,
  coreColors,
  handbookPages,
  logoAssets,
  messagingPillars,
  principles,
  typeFamilies,
  typeScales,
} from './data';

function Swatch({label, hex}) {
  const textColor =
    label === '50' ||
    label === '100' ||
    label === '200' ||
    label === '300' ||
    hex === '#F8FAFC' ||
    hex === '#F1F5F9'
      ? '#0F172A'
      : '#FFFFFF';
  return (
    <div className={styles.swatch} style={{backgroundColor: hex, color: textColor}}>
      <strong>Base {label}</strong>
      <span>{hex}</span>
    </div>
  );
}

export function BrandGuideHero() {
  return (
    <section className={styles.hero}>
      <div>
        <div className={styles.kicker}>Digital Church Design Guide</div>
        <Heading as="h1" className={styles.heroTitle}>
          A working brand system for Digital Church.
        </Heading>
        <p className={styles.heroCopy}>
          This guide turns the current Digital Church brand into a practical system for
          design, product, marketing, and implementation. Canonical source lives in
          Digital Church HQ; this page is the team-friendly presentation layer.
        </p>
      </div>
      <div className={styles.heroPanel}>
        <div className={styles.badge}>One platform</div>
        <div className={styles.badge}>One owned domain</div>
        <div className={styles.badge}>One source of truth</div>
      </div>
    </section>
  );
}

export function HandbookPageLinks() {
  return (
    <section className={styles.section}>
      <Heading as="h2">Sections</Heading>
      <div className={styles.cardGrid}>
        {handbookPages.map((page) => (
          <Link key={page.title} className={styles.linkCard} to={page.href}>
            <Heading as="h3">{page.title}</Heading>
            <p>{page.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function IdentitySection() {
  return (
    <>
      <section className={styles.section}>
        <Heading as="h2">Brand direction</Heading>
        <p>
          Digital Church should feel clean, modern, spacious, and confident without
          becoming sterile or corporate. It should communicate clarity, ownership, and
          momentum while remaining warm enough for the relational nature of church life.
        </p>
        <div className={styles.principlesGrid}>
          {principles.map((item) => (
            <div key={item} className={styles.principleCard}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <Heading as="h2">Logo system</Heading>
        <p>
          The primary mark is the full horizontal Digital Church logo. Use the icon-only
          mark when the wordmark would become illegible or when the layout needs a compact
          square brand treatment.
        </p>
        <div className={styles.cardGrid}>
          {logoAssets.map((asset) => (
            <div key={asset.file} className={styles.patternCard}>
              <div className={styles.meta}>{asset.file}</div>
              <p>{asset.use}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <Heading as="h2">Voice and messaging</Heading>
        <p>
          Digital Church messaging should stay clear, confident, ministry-first, and
          honest. The brand should never sound like generic enterprise software.
        </p>
        <div className={styles.pillRow}>
          {messagingPillars.map((item) => (
            <span key={item} className={styles.pill}>
              {item}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}

export function ColorsSection() {
  return (
    <>
      <section className={styles.section}>
        <Heading as="h2">Core colors</Heading>
        <div className={styles.cardGrid}>
          {coreColors.map((color) => (
            <div key={color.name} className={styles.colorCard}>
              <div className={styles.colorChip} style={{backgroundColor: color.hex}} />
              <div>
                <strong>{color.name}</strong>
                <div className={styles.meta}>{color.token}</div>
                <div className={styles.meta}>{color.hex}</div>
                <p>{color.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <Heading as="h2">Base palette</Heading>
        <p>
          Digital Church uses the full Tailwind Slate palette as its foundational system.
          In Digital Church language, this family is called <strong>Base</strong>, not
          neutral.
        </p>
        <div className={styles.swatchGrid}>
          {basePalette.map(([label, hex]) => (
            <Swatch key={label} label={label} hex={hex} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <Heading as="h2">Action colors</Heading>
        <p>Digital Church uses six action-color roles across product and marketing surfaces.</p>
        <div className={styles.actionGrid}>
          {actionRoles.map((role) => (
            <div key={role.name} className={styles.actionCard}>
              <div className={styles.actionAccent} style={{backgroundColor: role.accent}} />
              <strong>{role.name}</strong>
              <p>{role.usage}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function TypographySection() {
  return (
    <>
      <section className={styles.section}>
        <Heading as="h2">Typography system</Heading>
        <div className={styles.cardGrid}>
          {typeFamilies.map((family) => (
            <div key={family.label} className={styles.typeCard}>
              <div className={styles.meta}>{family.className}</div>
              <Heading as="h3">{family.label}</Heading>
              <div className={styles.meta}>{family.font}</div>
              <p>{family.role}</p>
              <div
                className={
                  family.label === 'Display'
                    ? styles.sampleDisplay
                    : family.label === 'Article'
                      ? styles.sampleArticle
                      : styles.sampleUi
                }>
                {family.sample}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.subSection}>
          <Heading as="h3">Clamp + typescales</Heading>
          <p>
            All three families use clamp-based sizing. Maximum values are set at
            <strong> 1440px</strong>, and the minimum scale naturally takes over when the
            system reaches the lower threshold, typically <strong>480px</strong>.
          </p>
          <div className={styles.pillRow}>
            {typeScales.map((scale) => (
              <span key={scale} className={styles.pill}>
                {scale}
              </span>
            ))}
          </div>
          <div className={styles.noteBox}>
            <strong>Current guidance</strong>
            <ul>
              <li>Use primitive values plus token assignments as two separate layers.</li>
              <li>Keep clamp math simple and driven by the desktop max value.</li>
              <li>Display, Article, and Interface each get their own typescale choice.</li>
              <li>Line height must preserve the 4px vertical baseline grid.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <Heading as="h2">Vertical rhythm</Heading>
        <p>
          Line height should resolve to the <strong>4px vertical baseline grid</strong>.
          Fluid type is allowed, but it cannot break readable rhythm. If clamp values
          cause awkward rhythm, adjust the token pairings instead of abandoning the grid.
        </p>
      </section>
    </>
  );
}

export function ComponentsSection() {
  return (
    <>
      <section className={styles.section}>
        <Heading as="h2">Component language</Heading>
        <div className={styles.cardGrid}>
          {componentPatterns.map((pattern) => (
            <div key={pattern.title} className={styles.patternCard}>
              <Heading as="h3">{pattern.title}</Heading>
              <p>{pattern.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <Heading as="h2">Implementation tokens</Heading>
        <div className={styles.codeBlock}>
          <pre>{`--base-50  → --base-950
--brand-300 → --brand-700
--font-display
--font-article
--font-ui
--display-typescale
--article-typescale
--ui-typescale`}</pre>
        </div>
      </section>
    </>
  );
}

export default function BrandGuide() {
  return (
    <div className={styles.brandGuide}>
      <BrandGuideHero />
      <HandbookPageLinks />
      <IdentitySection />
      <ColorsSection />
      <TypographySection />
      <ComponentsSection />
    </div>
  );
}
