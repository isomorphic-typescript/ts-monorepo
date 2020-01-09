import * as path from 'path';
import deepmerge = require("deepmerge");
import { TS_CONFIG_JSON_ROOT_DIR, TS_CONFIG_JSON_FILENAME } from "../../../../common/constants";
import { MonorepoPackage } from "../../../../common/types/monorepo-package";

export function monorepoPakcageToTSConfigJsonOutput(monorepoPackage: MonorepoPackage): Object {
    return deepmerge(
        (monorepoPackage.config.files.json)[TS_CONFIG_JSON_FILENAME],
        {
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