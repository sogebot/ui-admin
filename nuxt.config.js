import fs from 'fs';

const packageJson = fs.readFileSync('./package.json');
const version = JSON.parse(packageJson).version || 0;

export default {
  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',
  ssr:    false,

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: '%s',
    title:         'sogeBot - admin page',
    htmlAttrs:     { lang: 'en' },
    meta:          [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description', name: 'description', content: '',
      },
    ],
    link: [{
      rel: 'icon', type: 'image/x-icon', href: '/favicon.ico',
    }],
  },

  env: {
    isNuxtDev: process.env.NODE_ENV === 'development', BUILD: 'web', version,
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@/assets/colors.scss',
    '@/assets/global.scss',
    '@/assets/transitions.scss',
    '@/assets/letter-animations.scss',
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    '@/plugins/remove-shift-selection',
    '@/plugins/before-each.ts',
    { src: '@/plugins/log-version.js', ssr: false },
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',
    // https://go.nuxtjs.dev/vuetify
    ['@nuxtjs/vuetify', { treeShake: true }],
    // https://composition-api.nuxtjs.org/
    '@nuxtjs/composition-api/module',
  ],

  vuetify: {
    icons:      { iconfont: 'mdiSvg' },
    breakpoint: { mobileBreakpoint: 'sm' },
    theme:      {
      options: { customProperties: true },
      dark:    true,
      themes:  { dark: { primary: '#FF9800' } },
    },
  },

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    '@nuxtjs/axios',
    '@nuxtjs/proxy',
    'portal-vue/nuxt',
  ],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},

  router: {
    mode: 'hash',

    extendRoutes (routes, resolve) {
      routes.push({
        path:       '/manage/viewers/:id',
        components: { default: resolve(__dirname, 'pages/manage/viewers') },
      });
    },
  },

  axios: { proxy: true },

  // enable api proxy
  ...process.env.NODE_ENV === 'development' && {
    proxy: {
      '/graphql': {
        changeOrigin: true,
        target:       'http://localhost:20000',
      },
      '/api': {
        changeOrigin: true,
        target:       'http://localhost:20000',
      },
      '/credentials': {
        changeOrigin: true,
        target:       'http://localhost:3001',
      },
      '/overlays': {
        changeOrigin: true,
        target:       'http://localhost:3002',
      },
      '/public': {
        changeOrigin: true,
        target:       'http://localhost:3003',
      },
    },
  },
};
