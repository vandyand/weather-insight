const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const DotenvWebpackPlugin = require("dotenv-webpack");

module.exports = (env, argv) => {
  const mode = argv.mode || "development";
  const mapboxToken =
    "sk.eyJ1IjoidmFuZHlhbmQiLCJhIjoiY203d25iOTVqMDBqNjJ0bzc4NDNwZ2lkYSJ9.LY9s0hOgupL4cFURhI2Q9Q";

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
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
            },
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: "asset/resource",
        },
      ],
    },
    resolve: {
      extensions: [".js", ".jsx"],
      alias: {
        "@components": path.resolve(__dirname, "src/components"),
        "@pages": path.resolve(__dirname, "src/pages"),
        "@hooks": path.resolve(__dirname, "src/hooks"),
        "@services": path.resolve(__dirname, "src/services"),
        "@utils": path.resolve(__dirname, "src/utils"),
        "@context": path.resolve(__dirname, "src/context"),
        "@assets": path.resolve(__dirname, "src/assets"),
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        scriptLoading: "blocking",
        inject: "body",
        minify: false,
        templateParameters: {
          mapboxToken,
        },
      }),
      new DotenvWebpackPlugin(),
    ],
    devServer: {
      historyApiFallback: true,
      port: 3000,
      proxy: {
        "/api": "http://localhost:8080",
      },
    },
  };
};
