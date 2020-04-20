"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../logging/log");
const colorize_special_text_1 = require("../colorize-special-text");
const fs = require("fs");
const path = require("path");
const AUDIT_TAP_NAME = "AUDIT TAPPER";
//let remaining = 1;
// Go to https://www.planttext.com/ to visualize output
const FILE_PATH = path.resolve(`./bundle/build-at-${Date.now()}.txt`);
const appendQueue = [];
function append(line) {
    function write(outStream) {
        const lineToWrite = appendQueue[0];
        outStream.write(lineToWrite + "\n", error => {
            if (error) {
                log_1.log.error("unable to write line: " + lineToWrite);
            }
            appendQueue.shift();
            if (appendQueue.length > 0) {
                write(outStream);
            }
            else {
                outStream.end();
            }
        });
    }
    appendQueue.push(line);
    if (appendQueue.length === 1) {
        const outStream = fs.createWriteStream(FILE_PATH, { flags: 'a' });
        write(outStream);
    }
}
function init() {
    append("@startuml");
    append("digraph ABC {");
}
exports.init = init;
function close() {
    append("}");
    append("@enduml");
}
exports.close = close;
function appendModule(module, bad) {
    const { debugId, request, rawRequest, userRequest } = module;
    append(`  m${debugId} [label="{req ${request} | raw ${rawRequest} | user ${userRequest}}"${bad ? ` fillcolor=red` : ""}]`);
}
exports.appendModule = appendModule;
function appendRelationship(sourceModule, destModule, dependency) {
    append(`  m${sourceModule.debugId} -> m${destModule.debugId} [label="${dependency.type}"]`);
}
exports.appendRelationship = appendRelationship;
function setUpAudit(compiler) {
    init;
    appendModule;
    appendRelationship;
    //init();
    compiler.hooks.compilation.tap(AUDIT_TAP_NAME, (compilation, _normalModuleFactory) => {
        log_1.log.trace('compiler.compilation');
        compilation;
        colorize_special_text_1.colorize;
        let thing = null;
        thing;
        // before module is built.
        /*
        compilation.hooks.buildModule.tap(AUDIT_TAP_NAME, ((module: FinalModule) => {
            //appendModule(module);
            const incoming: Set<ModuleGraphConnection> = (compilation as any).moduleGraph.getIncomingConnections(module);
            incoming.forEach(incomingConnection => {
                if (incomingConnection.originModule !== null) {
                    appendRelationship(incomingConnection.originModule, incomingConnection.module, incomingConnection.dependency);
                }
            });
        }) as any);

        compilation.hooks.failedModule.tap(AUDIT_TAP_NAME, ((module: FinalModule, error: Error) => {
            log.trace(`compiler.compilation.failedModule ${colorize.file(module.rawRequest)}. ${module.debugId}`);
            log.error('error with name ' + error.name)
        }) as any);

        compilation.hooks.succeedModule.tap(AUDIT_TAP_NAME, ((module: FinalModule) => {
            log.trace(`compiler.compilation.succeedModule ${colorize.file(module.rawRequest)}. ${module.debugId}`);
        }) as any);

        compilation.hooks.seal.tap(AUDIT_TAP_NAME, () => {
            log.trace('compiler.compilation.seal');
        });

        compilation.hooks.unseal.tap(AUDIT_TAP_NAME, () => {
            log.trace('compiler.compilation.unseal');
        });
        
        compilation.hooks.optimize.tap(AUDIT_TAP_NAME, () => {
            log.trace('compiler.compilation.optimize');
        });

        // SyncBailHook so we can bail by returning something.
        compilation.hooks.optimizeDependencies.tap(AUDIT_TAP_NAME, modules => {
            log.trace('compiler.compilation.optimizeDependencies');
            log.info('total modules = ' + modules.length);
        });

        compilation.hooks.afterOptimizeDependencies.tap(AUDIT_TAP_NAME, modules => {
            log.trace('compiler.compilation.afterOptimizeDependencies');
            log.info("total modules = " + modules.length);
        });

        // SyncBailHook
        compilation.hooks.optimizeModules.tap(AUDIT_TAP_NAME, modules => {
            log.trace('compiler.compilation.optimizeModules');
            log.info('total modules = ' + modules.length);
        });

        compilation.hooks.beforeModuleIds.tap(AUDIT_TAP_NAME, modules => {
            log.trace('compiler.compilation.beforeModuleIds');
            log.info('total modules = ' + modules.length);
        });

        compilation.hooks.moduleIds.tap(AUDIT_TAP_NAME, modules => {
            log.trace('compiler.compilation.moduleIds');
            log.info('total modules = ' + modules.length);
        });

        compilation.hooks.optimizeModuleIds.tap(AUDIT_TAP_NAME, modules => {
            log.trace('compiler.compilation.optimizeModuleIds');
            log.info('total modules = ' + modules.length);
        });

        compilation.hooks.afterOptimizeModuleIds.tap(AUDIT_TAP_NAME, modules => {
            log.trace('compiler.compilation.afterOptimizeModuleIds');
            log.info('total modules = ' + modules.length);
        });

        compilation.hooks.recordModules.tap(AUDIT_TAP_NAME, (modules, records) => {
            log.trace('compiler.compilation.recordModules');
            log.info('total modules = ' + modules.length);
            log.info('total records = ' + records.length);
        });
        */
    });
    compiler.hooks.done.tap(AUDIT_TAP_NAME, _stats => {
        //append("}");
        //append("@enduml");
    });
}
exports.setUpAudit = setUpAudit;
//# sourceMappingURL=webpack-audit-hooks.js.map