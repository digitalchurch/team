export const coreColors = [
  {
    name: 'Digital Church Blue',
    token: '--brand-400',
    hex: '#0F1FFE',
    usage: 'Primary CTA, active emphasis, core brand recognition',
  },
  {
    name: 'Wordmark Slate',
    token: '--base-800',
    hex: '#1E293B',
    usage: 'Strong text, navigation, UI structure',
  },
  {
    name: 'Pillar White',
    token: '--base-50',
    hex: '#F8FAFC',
    usage: 'Logo contrast, highlights, light surfaces',
  },
];

export const basePalette = [
  ['50', '#F8FAFC'],
  ['100', '#F1F5F9'],
  ['200', '#E2E8F0'],
  ['300', '#CBD5E1'],
  ['400', '#94A3B8'],
  ['500', '#64748B'],
  ['600', '#475569'],
  ['700', '#334155'],
  ['800', '#1E293B'],
  ['900', '#0F172A'],
  ['950', '#020617'],
];

export const actionRoles = [
  {
    name: 'Success',
    accent: 'var(--success-500)',
    usage: 'Positive states, confirmations, completed actions',
  },
  {
    name: 'Warning',
    accent: 'var(--warning-500)',
    usage: 'Caution, elevated attention, non-fatal risk',
  },
  {
    name: 'Danger',
    accent: 'var(--danger-500)',
    usage: 'Errors, destructive actions, critical notices',
  },
  {
    name: 'Primary',
    accent: 'var(--brand-400)',
    usage: 'Highest-priority action and strongest emphasis',
  },
  {
    name: 'Secondary',
    accent: 'var(--base-700)',
    usage: 'Structured supporting actions with lower emphasis',
  },
  {
    name: 'Tertiary',
    accent: 'var(--base-400)',
    usage: 'Quiet controls, text actions, minimal interface emphasis',
  },
];

export const logoAssets = [
  {
    file: 'DigitalChurch_FullColorLogo.svg',
    use: 'Default logo for light backgrounds, headers, sales, and marketing.',
  },
  {
    file: 'DigitalChurch_DarkModeLogo.svg',
    use: 'Logo for dark surfaces, overlays, and reversed contexts.',
  },
  {
    file: 'DigitalChurch_FullColorIcon.svg',
    use: 'Icon-only applications like favicons, app icons, and avatars.',
  },
];

export const typeFamilies = [
  {
    label: 'Display',
    className: '.display',
    font: 'Manrope',
    role: 'Hero headlines, section anchors, brand-forward statements',
    sample: 'Church Website Builder that Helps Your Church Grow',
  },
  {
    label: 'Article',
    className: '.article',
    font: 'System Sans',
    role: 'Long-form reading, supporting editorial copy, narrative content',
    sample:
      'Digital Church helps churches keep their website, content, and engagement tools working together.',
  },
  {
    label: 'Interface',
    className: '.ui',
    font: 'System Sans',
    role: 'Navigation, labels, buttons, forms, controls, product surfaces',
    sample: 'Try Digital Church Free',
  },
];

export const typeScales = [
  'Minor Second',
  'Major Second',
  'Minor Third',
  'Major Third',
  'Perfect Fourth',
  'Augmented Fourth',
  'Perfect Fifth',
  'Golden Ratio',
  'Custom',
];

export const principles = [
  'Clear over clever',
  'Modern without trend-chasing',
  'Ministry-first, not SaaS-bro',
  'Confident without arrogance',
  'Simple by default, flexible underneath',
  'Readable, accessible, and practical',
];

export const componentPatterns = [
  {
    title: 'Buttons',
    body: 'Primary actions use brand blue. Secondary and tertiary actions step down in emphasis without losing clarity.',
  },
  {
    title: 'Cards',
    body: 'White or light surfaces, soft radius, subtle shadow, clean hierarchy, and generous spacing.',
  },
  {
    title: 'Navigation',
    body: 'Text-led, sparse, and structured. Blue is reserved for the highest-priority CTA, not everything.',
  },
  {
    title: 'Screenshots',
    body: 'Product UI is proof, not decoration. Screenshots should be cleanly framed, readable, and high-confidence.',
  },
];

export const messagingPillars = [
  'One platform. One login. One source of truth.',
  'Your church. Your data. Your domain.',
  'Keep your church connected, all week long.',
  'Technology that serves the church, not the other way around.',
];

export const handbookPages = [
  {
    title: 'Identity',
    href: '/docs/brand/identity',
    description: 'Brand direction, logo system, and messaging foundations.',
  },
  {
    title: 'Colors',
    href: '/docs/brand/colors',
    description: 'Core colors, full Base palette, and six action-color roles.',
  },
  {
    title: 'Typography',
    href: '/docs/brand/typography',
    description: 'Display, Article, Interface, clamp rules, typescales, and vertical rhythm.',
  },
  {
    title: 'Components',
    href: '/docs/brand/components',
    description: 'Buttons, cards, navigation, screenshots, and implementation token guidance.',
  },
];
