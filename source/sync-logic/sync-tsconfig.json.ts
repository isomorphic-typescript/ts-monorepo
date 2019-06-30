import * as deepmerge from 'deepmerge';
import * as path from 'path';

import TSMonorepoConfig, { TSConfigJSON } from "../config-file-structural-checking/config";
import { PackageDependencyTracker } from './package-dependency-tracker';
import { syncGenericJSON } from './sync-generic.json';

export async function syncTSConfigJSON(packageName: string, relativePackageName: string, packageIsScoped: boolean, absolutePackagePath: string, configFileJSON: TSMonorepoConfig) {
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

    await syncGenericJSON(absoluteTSConfigJSONPath, relativeTSConfigJSONPath, resultingTSConfigJSONObj);
}