"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const latestVersion = require("latest-version");
class CachedLatestVersionFetcher {
    constructor() {
        this.latestVersionsMap = new Map();
    }
    latestVersion(dependency) {
        const latestVersionPromise = this.latestVersionsMap.get(dependency);
        if (latestVersionPromise === undefined) {
            const newLatestVersionPromise = latestVersion(dependency);
            this.latestVersionsMap.set(dependency, newLatestVersionPromise);
            return newLatestVersionPromise;
        }
        else {
            return latestVersionPromise;
        }
    }
}
exports.CachedLatestVersionFetcher = CachedLatestVersionFetcher;
//# sourceMappingURL=cached-latest-version-fetcher.js.map