const path = require('path');
const fs = require('fs');
const child_process = require("child_process");

const stablePackageJSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../stable/package.json")).toString());
const version = stablePackageJSON.version;

const [npm, filename, ...tags] = Array.from(process.argv.values());

tags.forEach(tag => {
    const command = `npm dist-tag add @isomorphic-typescript/ts-monorepo@${version} ${tag}`;
    console.log(command);
    child_process.execSync(command);
});