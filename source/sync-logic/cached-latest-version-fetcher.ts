import * as latestVersion from 'latest-version';
export class CachedLatestVersionFetcher {
    private readonly latestVersionsMap: Map<string, Promise<string>>;
    public constructor() {
        this.latestVersionsMap = new Map();
    }
    public latestVersion(dependency: string): Promise<string> {
        const latestVersionPromise = this.latestVersionsMap.get(dependency);
        if (latestVersionPromise === undefined) {
            const newLatestVersionPromise = latestVersion(dependency);
            this.latestVersionsMap.set(dependency, newLatestVersionPromise);
            return newLatestVersionPromise;
        } else {
            return latestVersionPromise;
        }
    }
}