const path = require('path');

module.exports = {
  entry: './src/webview/src/App.tsx', // Your UI entry point
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'webview.js', // This is what the webview will load
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
       use: [
          {
            loader: 'ts-loader',
            options: {
              // This ensures the loader respects your webview's ESM settings
              configFile: path.resolve(__dirname, 'src/webview/tsconfig.json'),
            },
          },
        ],
        exclude: /node_modules/,
       
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};