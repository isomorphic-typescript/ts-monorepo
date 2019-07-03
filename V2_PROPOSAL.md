This is a proposal for V1/V2, whatever we want to make the next major version be.

<ol>
<li>
When specifying dependencies, either include the name in the array for the tool to determine latest version, or put an object in the array which allows you to define the version.

```typescript
type DependencyEntry = string | {package: string, version: string};
```
</li>
<li>
Give packages the ability to set their own version if desired.
</li>
<li>
Publishing from the distribution directory is now enabled via a `publishFromHere` option in the tsconfig.json's compilerOptions outDir field instead of the standard outDir string.
</li>
<li>
Add VSCode extension to recognize the structure, allow comments, validate package names, and have go to link from package name to reference on npm, within config file, or within monorepo. Have a clickable link next to monorepo versions to bump up by patch, minor, or major version, and show how that version in the monorepo config file differs from what is currently published to npm.
</li>
<li>
Now instead of having base configs of tsconfig.json and package.json only, it should be basePackageConfigs which is a map from config name to base package config. The package config then has configs for tsconfig.json, package.json, other config files, plus options unique to ts-monorepo. Having multiple basePackageConfigs means that each config must extend its base by name. 
</li>
</ol>

I'm imaginging something like this:

```json
{
    "packageRoot": "packages",
    "basePackageConfigs": {
        "default": {
            "configs": {
                "package.json": {
                    "version": "0.1.2",
                    "author": "Alexander Leung",
                    "license": "MIT",
                    "dependencies": [
                        "ansicolor",
                        { "package": "react", "version": "^13" }
                    ],
                    "devDependencies": [
                        "@types/node"
                    ]
                },
                "tsconfig.json": {
                    "compilerOptions": {
                        "module": "commonjs",
                        "target": "es6",
                        "lib": ["esnext"],
                        "rootDir": "./source"
                    },
                    "types": ["node"]
                },
                "someothercustomconfig.json": {
                    "somestuff": "something"
                } 
            }
        },
        "distribuedFromDistribution": {
            "extends": ["default"],
            "configs": {
                "tsconfig.json": {
                    "compilerOptions": {
                        "outDir": {
                            "path": "./distribution",
                            "publishFromHere": true
                        }
                    }
                }
            },
            "copyFiles": {
                "package.json": "distribution/",
                ".npmignore": "distribution/",
                "someothercustomconfig.json": "distribution/configwithanewname.json",
                "source/someimportantdatafile.txt": "distribution/data.txt"
            },
            "deleteConfig": [
                "[configs][someothercustomconfig]",
                "[configs][package.json][devDependencies][@types/node]",
                "[configs][package.json][dependencies][[package]react]"
            ]
        }
    },
    "packages": {
        "project1": {
            "extends": "default",
            "configs": {
                "package.json": {
                    "files": ["distribution"],
                    "main": "./distribution/package.js",
                    "types": "./distribution/package.d.ts",
                    "description": "some package for node",
                    "scripts": {
                        "custom": "project2-command input"
                    },
                    "devDependencies": [
                        "@somescope/project2"
                    ]
                }
            }
        },
        "@somescope/project2": {
            "extends": "distribuedFromDistribution",
            "configs": {
                "package.json": {
                    "description": "some command line tool for node",
                    "bin": {
                        "project2-command": "./distribution/project2-command.js"
                    },
                    "dependencies": [
                        "@types/node"
                    ]
                }
            }
        }
    }
}
```