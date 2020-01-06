import * as path from 'path';
import deepmerge = require("deepmerge");
import { TS_CONFIG_JSON_ROOT_DIR, TS_CONFIG_JSON_OUT_DIR, TS_CONFIG_JSON_FILENAME } from "../../../../common/constants";
import { MonorepoPackage } from "../../../../common/types/monorepo-package";

export function monorepoPakcageToTSConfigJsonOutput(monorepoPackage: MonorepoPackage): Object {
    return deepmerge(
        (monorepoPackage.config.files.json as any)[TS_CONFIG_JSON_FILENAME],
        {
            compilerOptions: {
                rootDir: TS_CONFIG_JSON_ROOT_DIR,
                outDir: TS_CONFIG_JSON_OUT_DIR,
                // See https://github.com/RyanCavanaugh/learn-a#tsconfigsettingsjson for below
                composite: true,
                declaration: true,
                declarationMap: true,
                sourceMap: true
            },
            include: [
                `${TS_CONFIG_JSON_ROOT_DIR}/**/*`
            ],
            references: Object.values(monorepoPackage.relationships.dependsOn)
                .map(dependencyMonorepoPackage => {
                    // Calculate relative path to dependency from relative path of current.
                    return {
                        path: path.relative(
                            path.resolve(monorepoPackage.relativePath),
                            path.resolve(dependencyMonorepoPackage.relativePath)
                        )
                    };
                })
        }
    );
}