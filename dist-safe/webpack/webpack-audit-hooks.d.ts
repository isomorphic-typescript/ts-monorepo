import * as webpack from 'webpack';
import { FinalModule, ModuleDependency, NormalModule } from "../common/types/package.d.ts/webpack";
export declare function init(): void;
export declare function close(): void;
export declare function appendModule(module: FinalModule, bad: boolean): void;
export declare function appendRelationship(sourceModule: NormalModule, destModule: NormalModule, dependency: ModuleDependency): void;
export declare function setUpAudit(compiler: webpack.Compiler): void;
//# sourceMappingURL=webpack-audit-hooks.d.ts.map