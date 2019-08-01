import * as path from 'path';
import { fsAsync } from "../util/fs-async";

export class HoistManager {
    private monorepoPackages: Set<string>;
    private hoistedPackages: Map<string, Set<string>>; // Map from package names to Set of version strings.
    private hoistsInProgress: number;
    private hoistStarted: boolean;
    private cleanStarted: boolean;

    public static async createHoistManager(monorepoPackages: string[]) {
        // create .ts-monorepo folder.
        // create .ts-monorepo/hoist folder.
        return new this(monorepoPackages);
    }

    private constructor(monorepoPackages: string[]) {
        this.monorepoPackages = new Set(monorepoPackages);
        this.hoistedPackages = new Map();
        this.hoistsInProgress = 0;
        this.hoistStarted = false;
        this.cleanStarted = false;
    }

    public async hoist(currentAbsolutePackagePath: string) {
        if (this.cleanStarted) throw new Error("Cannot hoist after clean started");
        this.hoistStarted = true;
        this.hoistsInProgress++;
        const packageJSONPath = path.resolve(currentAbsolutePackagePath, "package.json");
        const packageJSON = JSON.parse((await fsAsync.readFile(packageJSONPath)).toString());
        if(!this.monorepoPackages.has(packageJSON.name)) {
            const hoistedPackagesEntry = this.hoistedPackages.get(packageJSON.name);
            if (hoistedPackagesEntry) {
                if (!hoistedPackagesEntry.has(packageJSON.version)) {
                    hoistedPackagesEntry.add(packageJSON.version);
                    await this.individualHoist(currentAbsolutePackagePath);
                }
            } else {
                this.hoistedPackages.set(packageJSON.name, new Set([packageJSON.version]));
                await this.individualHoist(currentAbsolutePackagePath);
            }
        }
        this.hoistsInProgress--;
    }

    private async individualHoist(currentAbsolutePackagePath: string) {
        const nodeModulesPath = path.resolve(currentAbsolutePackagePath, "node_modules");
        const nodeModulesPackages = await fsAsync.readDirectory(nodeModulesPath);
        nodeModulesPackages.forEach(nodeMoudlePackage => {
            nodeMoudlePackage;
        });
    }

    public async cleanHoistFolder() {
        if (this.hoistsInProgress > 0) throw new Error("Cannot clean hoist folder while hoist is still in progress.");
        if (!this.hoistStarted) throw new Error("Cannot clean before hoisting.");
        this.cleanStarted = true;
    }
}