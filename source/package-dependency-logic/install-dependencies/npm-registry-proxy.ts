import { Terminateable } from "../../common/types/traits";
import { MonorepoPackageRegistry } from "../monorepo-package-registry";
import * as express from 'express';
import * as proxy from 'http-proxy-middleware';
import { Server, IncomingMessage } from "http";
import * as url from 'url';
import * as option from 'fp-ts/lib/Option';
import deepmerge = require("deepmerge");

const DEFAULT_NPM_REGISTRY_DOMAIN = 'registry.npmjs.org';
const DEFAULT_CHUNK_ENCODING = 'utf-8';
const OK_HTTP_STATUS = 200;

// TODO: refactor out to always on w/ dynamic middleware once Skoville support added.
export class NPMRegistryProxyServer implements Terminateable {
    private readonly server: Server;

    public constructor(private readonly registry: MonorepoPackageRegistry, port: number) {
        const app = express();
        app.use('*', this.setupProxy());
        this.server = app.listen(port);
    }

    private setupProxy(): proxy.Proxy {
         return proxy({
            target: DEFAULT_NPM_REGISTRY_DOMAIN,
            changeOrigin: true,
            onProxyReq: (proxyReq, req, _res) => {
                if (this.isMonorepoRelevantManifestRequest(req)) {
                    proxyReq.removeHeader('if-modified-since');
                    proxyReq.removeHeader('if-none-match');
                }
            },
            onProxyRes: (proxyRes, req, res) => {
                if (this.isMonorepoRelevantManifestRequest(req)) {
                    // Here we're basically doing all this plumbing so we can modify the response returned by the remote npm registry before returning the response to the npm client CLI.
                    const originalWriteHead = res.writeHead;
                    const originalEnd = res.end;
                    const bodyBuilder: string[] = []; // haha.. "body builder"
                    (res as any).writeHead = (...writeHeadArgs: any[]) => {
                        console.log("received writeHead request with args");
                        console.log(writeHeadArgs);
                        return res;
                    }
                    (res as any).write = (data: any, encodingOrCallback?: string | (() => void), _maybeCallback?: () => void) => {
                        const encoding = typeof encodingOrCallback === 'string' ? encodingOrCallback : DEFAULT_CHUNK_ENCODING;
                        bodyBuilder.push(data.toString(encoding));
                    }
                    (res as any).end = (chunk?: any, encodingOrCallback?: string | (() => {}), _maybeCallback?: () => void) => {
                        const encoding = typeof encodingOrCallback === 'string' ? encodingOrCallback : DEFAULT_CHUNK_ENCODING;
                        if (typeof chunk !== 'function') {
                            bodyBuilder.push(chunk.toString(encoding));
                        }
                        const body = bodyBuilder.join("");
                        const parsedBody = JSON.parse(body.length > 0 ? body : "{}");
                        const bodyWithMonorepoInfo = JSON.stringify(
                            deepmerge(
                                parsedBody, // If parsed body contains error message, use {} instead of parsed body.
                                {
                                    versions: {
                                        [monorepoPackageVersion]: monorepoPackageJson
                                    },
                                    "dist-tags": {
                                        latest: monorepoPackageVersion // do comparison with actual latest version.
                                    },
                                    modified: new Date().toISOString()
                                }
                            )
                        );
                        if ('headers' in proxyRes && 'content-length' in proxyRes.headers) {
                            res.setHeader('content-length', Buffer.byteLength(bodyWithMonorepoInfo));
                        }
                        res.setHeader('transfer-encoding', '');
                        res.setHeader('cache-control', 'no-cache');
                        originalWriteHead.apply(res, [OK_HTTP_STATUS]);
                        originalEnd.apply(res, [bodyWithMonorepoInfo, DEFAULT_CHUNK_ENCODING]);
                    }
                }
            }
        });
    }

    private isMonorepoRelevantManifestRequest(req: IncomingMessage) {
        if (req.url === undefined) return false;
        const urlParsed = url.parse(req.url);
        const path = urlParsed.pathname;
        if (path === null) return false;
        const possiblePackageName = decodeURIComponent(path.substring(1));
        const maybePackage = this.registry.getMonorepoPackageIfCompatibleAndPresent(possiblePackageName);
        return req.method === 'GET' && option.isSome(maybePackage);
    }

    public terminate() {
        return new Promise<void>((resolve, reject) => {
            this.server.close(error => {
                if (error === undefined) {
                    resolve();
                } else {
                    reject(error);
                }
            });
        });
    }
}