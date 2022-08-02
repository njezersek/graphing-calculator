const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin')

const dist = path.resolve(__dirname, "dist");

const moduleSettings = {
  rules: [
    {
      test: /\.(png|svg|jpg|jpeg|gif)$/i,
      type: 'asset/resource',
    },
    {
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    },
    {
      test: /\.glsl$/i,
      use: 'raw-loader',
    },
  ],
};

const resolveSettings = {
  plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json"})],
  extensions: ['.tsx', '.ts', '.js', '.glsl', '.wasm'],
};

const appConfig = (env, options) => ({
  entry: "./src/index.ts",
  watchOptions: {
    aggregateTimeout: 500,
    poll: 500,
  },
  devServer: {
    watchFiles: ["src/**/*", "backend/pkg/**/*"],
    hot: false,
    client: {
      progress: true,
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'static/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'static', 
          globOptions: {  ignore: ['**/index.html'] }
        }
      ]
    }),
  ],
  resolve: resolveSettings,
  module: moduleSettings,
  output: {
    path: dist,
    filename: 'app.js',
  },
});


const workerConfig = (env, options) => ({
  entry: "./src/worker.ts",
  watchOptions: {
    aggregateTimeout: 500,
    poll: 500,
  },
  target: "webworker",
  plugins: [
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, "backend"),
      args: '--log-level warn',
      forceMode: 'production',
      outDir: path.resolve(__dirname, "backend/pkg")
    }),
  ],
  resolve: resolveSettings,
  module: moduleSettings,
  experiments: {
    asyncWebAssembly: true,
  },
  output: {
    path: dist,
    filename: 'bundle-worker.js',
  },
});

module.exports = [appConfig, workerConfig];

