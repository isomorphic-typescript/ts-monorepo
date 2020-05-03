/*
import * as webpack from 'webpack';
import * as path from 'path';
export const generateWebpackConfig = (outputName: string): webpack.Configuration => ({
    mode: "none",
    output: {
        filename: `${outputName}.js`,
        path: path.resolve('./bundle')
    },
    entry: './distribution/ts-monorepo.js',
    target: 'node',
    stats: 'verbose',
    recordsOutputPath: path.resolve('./bundle/records.json')
});
*/