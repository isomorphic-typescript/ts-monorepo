import * as path from 'path';

import TSMonorepoJson from "../../config-file-structural-checking/config";
import { syncGenericJSON } from '../sync-generic.json.js';

export async function syncLernaJSON(lernaPackageRoots: Set<string>, configFileJSON: TSMonorepoJson) {
    const outputLernaConfig = {
        packages: Array.from(lernaPackageRoots),
        version: configFileJSON.version
    };
    const lernaJSON = "lerna.json";
    await syncGenericJSON(path.resolve(`./${lernaJSON}`), lernaJSON, outputLernaConfig);
}