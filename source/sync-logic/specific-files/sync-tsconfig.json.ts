import * as deepmerge from 'deepmerge';
import * as path from 'path';

import TSMonorepoJson, { TSConfigJSON } from "../../config-file-structural-checking/config";
import { PackageDependencyTracker } from '../package-dependency-tracker';
import { syncGenericJSON } from '../sync-generic.json.js';

export async function syncTSConfigJSON(packageName: string, relativePackageName: string, packageIsScoped: boolean, absolutePackagePath: string, configFileJSON: TSMonorepoJson) {
    const relativePathToPackageRoot = packageIsScoped ? "../../" : "../";
    const tsconfig = "tsconfig.json";
    const resultingTSConfigJSONObj: TSConfigJSON = deepmerge(
        deepmerge(
            configFileJSON.baseConfigs[tsconfig], 
            configFileJSON.packages[packageName].configs[tsconfig]
        ),
        {
            compilerOptions: {
                // https://github.com/RyanCavanaugh/learn-a#tsconfigsettingsjson
                composite: true,
                declaration: true,
                declarationMap: true,
                sourceMap: true
            },
            references: Array.from(PackageDependencyTracker.getDependenciesOf(packageName))
                .map(dependencyPackageName => ({path: relativePathToPackageRoot + dependencyPackageName}))
        }
    );
    
    const relativeTSConfigJSONPath = relativePackageName + "/" + tsconfig;
    const absoluteTSConfigJSONPath = path.resolve(absolutePackagePath, tsconfig);

    return await syncGenericJSON(absoluteTSConfigJSONPath, relativeTSConfigJSONPath, resultingTSConfigJSONObj);
}