import { ConfigError } from '../common/errors';
import { Success } from '../common/constants';
import * as taskEither from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts';
import { PackageConfig, JunctionConfig } from '../common/types/io-ts/config-types';
declare function removeLeadingPunctuation(packageNameSegment: string): string;
export declare const nameSegmentToSubFolderName: typeof removeLeadingPunctuation;
export interface ConfigTreeTraversalContext {
    packageNamePrefix: string;
    relativePath: string;
    pathSegment: string;
    configObjectPath: string[];
    packageNameSegment: string;
}
export declare function generateInitialContext(scope: string): ConfigTreeTraversalContext;
export declare function traversePackageTree(config: unknown, context: ConfigTreeTraversalContext, packageHandler: (packageConfig: t.TypeOf<typeof PackageConfig>, context: ConfigTreeTraversalContext, completePackageName: string) => taskEither.TaskEither<ConfigError[], Success>, junctionHandler: (junctionConfig: t.TypeOf<typeof JunctionConfig>, context: ConfigTreeTraversalContext, childContexts: Record<string, ConfigTreeTraversalContext>) => taskEither.TaskEither<ConfigError[], Success>): taskEither.TaskEither<ConfigError[], Success>;
export {};
//# sourceMappingURL=traverse-package-tree.d.ts.map