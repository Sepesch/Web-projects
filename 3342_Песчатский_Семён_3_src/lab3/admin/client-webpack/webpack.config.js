import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    mode: 'production',
    entry: {
        users: './src/scripts/users.js',
        friends: './src/scripts/friends.js', 
        news: './src/scripts/news.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'scripts/[name].min.js',
        publicPath: '/webpack/', // Добавьте эту строку
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /\.pug$/,
                use: 'pug-loader'
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name][ext]'
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/views/users.pug',
            filename: 'users.html',
            chunks: ['users']
        }),
        new HtmlWebpackPlugin({
            template: './src/views/friends.pug', 
            filename: 'friends.html',
            chunks: ['friends']
        }),
        new HtmlWebpackPlugin({
            template: './src/views/news.pug',
            filename: 'news.html', 
            chunks: ['news']
        }),
        new MiniCssExtractPlugin({
            filename: 'styles/[name].min.css'
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'src/photos/*.jpg',
                    to: 'photos/[name][ext]',
                    noErrorOnMissing: true
                }
            ]
        })
    ]
};