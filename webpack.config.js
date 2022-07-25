const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = (env, options) => ({
  entry: {
    index: './src/index.ts',
    worker: './src/worker.ts'
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'static', 
          globOptions: {  ignore: ['**/index.html'] }
        }
      ]
    }),
    new HtmlWebpackPlugin({
      template: 'static/index.html'
    }),
  ],
  devtool: options.mode == 'development' ? 'source-map' : undefined,
  devServer: {
    static: './dist',
  },
  module: {
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
  },
  resolve: {
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json"})],
    extensions: ['.tsx', '.ts', '.js', '.glsl'],
  },
  output: {
    filename: 'bundle-[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
});