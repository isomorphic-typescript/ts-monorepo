import * as path from 'path';

import TSMonorepoConfig from "../config-file-structural-checking/config";
import { syncGenericJSON } from './sync-generic.json';

export async function syncLernaJSON(lernaPackageRoots: Set<string>, configFileJSON: TSMonorepoConfig) {
    const outputLernaConfig = {
        packages: Array.from(lernaPackageRoots),
        version: configFileJSON.version
    };
    const lernaJSON = "lerna.json";
    await syncGenericJSON(path.resolve(`./${lernaJSON}`), lernaJSON, outputLernaConfig);
}