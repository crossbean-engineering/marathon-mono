const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/marathon-api'),
  },
  // Prisma 7's generated client imports sibling modules with `.js` specifiers
  // (e.g. "./enums.js") that resolve to `.ts` source files. Webpack does not
  // map `.js` -> `.ts` by default; without this the generated client can be
  // mis-bundled on a clean build -> "PrismaClient is not a constructor".
  resolve: {
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: [
        { input: './prisma', glob: '**/*', output: './prisma' },
        { input: '.', glob: 'prisma.config.ts', output: '.' },
        {
          input: './src/integration/email/templates',
          glob: '**/*.html',
          output: './email-templates',
        },
      ],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: {},
      externalDependencies: [
        'pg-native',
        '@prisma/client',
        '@prisma/adapter-pg',
      ],
    }),
  ],
};
