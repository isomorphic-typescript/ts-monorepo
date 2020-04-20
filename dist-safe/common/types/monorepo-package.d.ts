import { MergedPackageConfig } from "./merged-config";
export interface MonorepoPackage {
    relativePath: string;
    name: string;
    version: string;
    relationships: {
        dependsOn: Record<string, MonorepoPackage>;
        dependencyOf: Record<string, MonorepoPackage>;
    };
    config: MergedPackageConfig;
}
//# sourceMappingURL=monorepo-package.d.ts.map