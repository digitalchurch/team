// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Digital Church Team',
  tagline: 'Standard Operating Procedures & Guides',
  favicon: 'img/DigitalChurch_FullColorIcon.ico',
  noIndex: true,

  // Set the production url of your site here
  url: 'https://digitalchurch.team/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'digitalchurch', // Usually your GitHub org/user name.
  projectName: 'team', // Usually your repo name.

  onBrokenLinks: 'log',
  onBrokenMarkdownLinks: 'log',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/docs',
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: false,
        // blog: {
        //   showReadingTime: true,
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl:
        //     'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        // },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
        navbar: {
          title: 'Digital Church Team',
          logo: {
            alt: 'Digital Church',
            src: 'img/DigitalChurch_FullColorIcon.svg',
          },
          items: [
            {
              to: '/docs',
              label: 'Documentation',
              position: 'left',
            },
            {
              to: '/',
              label: 'KPIs',
              position: 'left',
            },
            {
              to: '/search',
              label: 'Search',
              position: 'left',
            },
          {
            href: 'https://digitalchurch.guide',
            label: 'User Guide',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Docs',
                to: '/docs',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/digitalchurch/team',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Digital Church Limited.`,
      },
      prism: {
        theme: prismThemes.dracula,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash'],
      },
    }),
};

export default config;
