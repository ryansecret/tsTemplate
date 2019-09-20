const path=require('path')
const webpack = require('webpack')
module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname,'src'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js'
  },
  module:{
    rules:[
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env']]
          }
        }
      }
    ]
  },
  target:"node",
  plugins: [
    new webpack.ProgressPlugin()
  ]
}
