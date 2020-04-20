"use strict";
/*
const compiler = webpack(generateWebpackConfig(TOOL_SHORT_NAME));
setUpAudit(compiler);
compiler.run((error, stats) => {
    log.info("webpack finished");

    if (error) {
        log.info("type of error is " + (typeof error));
        log.info("error is");
        log.error(error.stack || error.message);
    } else if (stats.hasErrors()) {
        log.error(`webpack has ${stats.compilation.errors.length} errors`);

        const seenModuleIds = new Set<number>();
        init();
        function recurseUp(mod: NormalModule) {
            const incoming: Set<ModuleGraphConnection> = (stats.compilation as any).moduleGraph.getIncomingConnections(mod);
            incoming.forEach(incomingConnection => {
                const incomingMod = incomingConnection.originModule;
                if (incomingMod !== null) {
                    appendRelationship(incomingMod, mod, incomingConnection.dependency);
                    if (!seenModuleIds.has(incomingMod.debugId)) {
                        seenModuleIds.add(mod.debugId);
                        appendModule(incomingMod as FinalModule, false);
                        recurseUp(incomingMod);
                    }
                }
            });
        }
        stats.compilation.errors.forEach((error: CompilationError, index) => {

            log.info(`${colorize.error((index + 1)+"")}. id = ${error.module.debugId}. Error = ${colorize.error(error.name)}`);
            console.log("\n");
            console.log(error.error);
            console.log("\n");

            const mod = error.module;
            seenModuleIds.add(mod.debugId);
            appendModule(mod, true);
            recurseUp(mod);
        });
        close();
    } else {
        log.info("There were no webpack errors");
    }
})
*/ 
//# sourceMappingURL=webpack-future-start.js.map