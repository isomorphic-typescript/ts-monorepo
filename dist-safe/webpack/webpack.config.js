"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
exports.generateWebpackConfig = (outputName) => ({
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
//# sourceMappingURL=webpack.config.js.map