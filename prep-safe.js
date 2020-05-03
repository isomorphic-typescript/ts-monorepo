const fs = require('fs');
const path = require('path');

const SAFE_NAME = "dist-safe";
const SAFE_PACKAGE_JSON_PATH = path.resolve(`./${SAFE_NAME}/package.json`);
const WORK_TREE_PACKAGE_JSON_PATH = path.resolve('./package.json');

async function main() {
    const safeJson = JSON.parse((await fs.promises.readFile(SAFE_PACKAGE_JSON_PATH)).toString());
    safeJson.private = true;
    await fs.promises.writeFile(SAFE_PACKAGE_JSON_PATH, JSON.stringify(safeJson, null, 2));
    const workTreeJson = JSON.parse((await fs.promises.readFile(WORK_TREE_PACKAGE_JSON_PATH)).toString());
    workTreeJson.workspaces = [SAFE_NAME];
    await fs.promises.writeFile(WORK_TREE_PACKAGE_JSON_PATH, JSON.stringify(workTreeJson, null, 2));
}

main().then(() => {
    process.exit();
});
