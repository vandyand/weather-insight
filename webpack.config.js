const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const DotenvWebpackPlugin = require("dotenv-webpack");

module.exports = (env, argv) => {
  const mode = argv.mode || "development";

  return {
    mode,
    entry: "./src/index.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bundle.js",
      publicPath: "/",
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpg|gif)$/i,
          type: "asset/resource",
        },
      ],
    },
    resolve: {
      extensions: [".js", ".jsx"],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        scriptLoading: "blocking",
        inject: "body",
        minify: false,
      }),
      new DotenvWebpackPlugin(),
    ],
    devServer: {
      historyApiFallback: true,
      port: 3000,
      hot: true,
    },
  };
};
