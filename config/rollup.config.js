import nodeResolve from 'rollup-plugin-node-resolve';
import invariantPlugin from 'rollup-plugin-invariant';
import { terser as minify } from 'rollup-plugin-terser';
import fs from 'fs';

import packageJson from '../package.json';

const distDir = './dist';

const external = [
  '@wry/context',
  '@wry/equality',
  'fast-json-stable-stringify',
  'graphql-tag',
  'graphql/execution/execute',
  'graphql/language/printer',
  'graphql/language/visitor',
  'hoist-non-react-statics',
  'optimism',
  'prop-types',
  'react',
  'subscriptions-transport-ws',
  'symbol-observable',
  'ts-invariant',
  'tslib',
  'zen-observable',
];

function prepareESM(input, outputDir) {
  return {
    input,
    external,
    output: {
      dir: outputDir,
      format: 'esm',
      sourcemap: true,
    },
    // The purpose of this job is to ensure each `./dist` ESM file is run
    // through the `invariantPlugin`, with any resulting changes added
    // directly back into each ESM file. By setting `preserveModules`
    // to `true`, we're making sure Rollup doesn't attempt to create a single
    // combined ESM bundle with the final result of running this job.
    preserveModules: true,
    plugins: [
      nodeResolve(),
      invariantPlugin({
        // Instead of completely stripping InvariantError messages in
        // production, this option assigns a numeric code to the
        // production version of each error (unique to the call/throw
        // location), which makes it much easier to trace production
        // errors back to the unminified code where they were thrown,
        // where the full error string can be found. See #4519.
        errorCodes: true,
      })
    ],
  };
}

function prepareCJS(input, output) {
  return {
    input,
    external,
    output: {
      file: output,
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      nodeResolve(),
      // When generating the `dist/core/core.cjs.js` entry point (in
      // `config/prepareDist.js`), we filter and re-export the exports we
      // need from the main Apollo Client CJS bundle (to exclude React related
      // code). This means that consumers of `core.cjs.js` attempt to load the
      // full AC CJS bundle first (before filtering exports), which then means
      // the React require in the AC CJS bundle is attempted and not found
      // (since people using `core.cjs.js` want to use Apollo Client without
      // React). To address this, we make React an optional require in the CJS
      // bundle.
      (() => {
        const cjsBundle = output.replace(`${distDir}/`, '');
        return {
          generateBundle(_option, bundle) {
            const parts = bundle[cjsBundle].code.split(
              /var React = require\('react'\);/);
            // The React import should appear only once in the CJS bundle,
            // since we build the CJS bundle using Rollup, which (hopefully!)
            // deduplicates all external imports.
            if (parts && parts.length === 2) {
              bundle[cjsBundle].code = [
                parts[0],
                "try { var React = require('react'); } catch (error) {}",
                parts[1],
              ].join("\n");
            } else {
              throw new Error(
                'The CJS bundle could not be prepared as a single React ' +
                'require could not be found.'
              );
            }
          }
        }
      })()
    ],
  };
}

function prepareCJSMinified(input) {
  return {
    input,
    output: {
      file: input.replace('.js', '.min.js'),
      format: 'cjs',
    },
    plugins: [
      minify({
        mangle: {
          toplevel: true,
        },
        compress: {
          toplevel: true,
          global_defs: {
            '@process.env.NODE_ENV': JSON.stringify('production'),
          },
        },
      }),
    ],
  };
}

// Build a separate CJS only `testing.js` bundle, that includes React
// testing utilities like `MockedProvider` (testing utilities are kept out of
// the main `apollo-client` bundle). This bundle can be accessed directly
// like:
//
// import { MockedProvider } from '@apollo/client/testing';
function prepareTesting() {
  const bundleName = 'testing';

  // Create a type file for the new testing bundle that points to the existing
  // `react/testing` type definitions.
  fs.writeFileSync(
    `${distDir}/${bundleName}.d.ts`,
    "export * from './utilities/testing';"
  );

  return {
    input: `${distDir}/utilities/testing/index.js`,
    external,
    output: {
      file: `${distDir}/${bundleName}.js`,
      format: 'cjs',
    },
    plugins: [
      nodeResolve({
        extensions: ['.js', '.jsx'],
      }),
    ],
  };
}

function prepareBundle(name, path) {
  const dir = `${distDir}/${path}`;
  return {
    input: `${dir}/index.js`,
    external,
    output: {
      file: `${dir}/${name}.cjs.js`,
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      nodeResolve(),
    ],
  };
}

function rollup() {
  return [
    prepareESM(packageJson.module, distDir),
    prepareCJS(packageJson.module, packageJson.main),
    prepareCJSMinified(packageJson.main),
    prepareBundle('cache', 'cache'),
    prepareBundle('core', 'core'),
    prepareBundle('link-batch', 'link/batch'),
    prepareBundle('link-batch-http', 'link/batch-http'),
    prepareBundle('link-context', 'link/context'),
    prepareBundle('link-core', 'link/core'),
    prepareBundle('link-error', 'link/error'),
    prepareBundle('link-http', 'link/http'),
    prepareBundle('link-retry', 'link/retry'),
    prepareBundle('link-schema', 'link/schema'),
    prepareBundle('link-ws', 'link/ws'),
    prepareBundle('react', 'react'),
    prepareBundle('react-components', 'react/components'),
    prepareBundle('react-hoc', 'react/hoc'),
    prepareBundle('react-ssr', 'react/ssr'),
    prepareBundle('utilities', 'utilities'),
    prepareTesting(),
  ];
}

export default rollup();
