import { MergedPackageJson } from "../common/types";

export interface MonorepoPackage {
    relativePath: string;
    name: string;
    version: string;
    monorepo: {
        dependsOn: Record<string, MonorepoPackage>;
        dependencyOf: Record<string, MonorepoPackage>;
    };
    npm: MergedPackageJson;
}