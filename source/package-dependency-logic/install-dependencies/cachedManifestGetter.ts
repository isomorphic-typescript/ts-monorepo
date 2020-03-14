import * as taskEither from 'fp-ts/lib/TaskEither';
import * as either from 'fp-ts/lib/Either';
import * as pacote from 'pacote';
import { ConfigError, ErrorType } from '../../common/errors';
import { colorize } from '../../colorize-special-text';

export class CachedManifestGetter {
    private cache: Map<string, pacote.Manifest>;

    public constructor() {
        this.cache = new Map();
    }

    public evictCacheEntriesNotInSpecList(seenDependencyIdentifiers: Set<[string, string]>) {
        const seenSpecs = new Set<string>(
            Array.from(seenDependencyIdentifiers.values()).map(([packageName, version]) => {
                return this.specFromDependencyAndVersion(packageName, version)
            })
        );
        Array.from(this.cache.entries())
            .forEach(([cachedSpec]) => {
                if (!seenSpecs.has(cachedSpec)) {
                    this.cache.delete(cachedSpec);
                }
            });
        // TODO: where should this really go?
        pacote.clearMemoized();
    }

    private specFromDependencyAndVersion(packageName: string, version: string) {
        return `${packageName}@${version}`;
    }

    public getManifest(packageWithDependency: string, packageName: string, version: string): taskEither.TaskEither<ConfigError[], pacote.Manifest> {
        const spec = this.specFromDependencyAndVersion(packageName, version);
        const cachedManifest = this.cache.get(spec);
        if (cachedManifest !== undefined) {
            return taskEither.right(cachedManifest);
        } else {
            return async () => {
                try {
                    const newlyFetchedManifest = await pacote.manifest(spec);
                    this.cache.set(spec, newlyFetchedManifest);
                    return either.right(newlyFetchedManifest);
                } catch(e) {
                    return either.left([{
                        type: ErrorType.InvalidDependencyVersion,
                        message: `The package ${colorize.package(packageWithDependency)} depends on package ${colorize.package(packageName)}\nwith unresolvable version ${colorize.package(version)}`
                    }]);
                }
            }
        }
    }
}