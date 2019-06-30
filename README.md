# How to use?

Install it: `npm i -D @isomorphic-typescript/ts-monorepo`

Then run it: `npx ts-monorepo`

# What is it?

This is a tool which watches a configuration file named `ts-monorepo.json` which resides in the project root and has the following format:

```json
{
    "packageRoot": "packages",
    "version": "0.1.2",
    "baseConfigs": {
        "package.json": {
            "files": ["distribution"],
            "main": "./distribution/package.js",
            "author": "Alexander Leung",
            "license": "MIT"
        },
        "tsconfig.json": {
            "compilerOptions": {
                "module": "commonjs",
                "target": "es6",
                "lib": ["esnext"]
            }
        }
    },
    "packages": {
        "project1": {
            "configs": {
                "package.json": {
                    "description": "some package for node",
                    "scripts": {
                        "custom": "project2-command input"
                    },
                    "dependencies": [
                        "project3",
                        "@types/node"
                    ],
                    "devDependencies": [
                        "@somescope/project2"
                    ]
                },
                "tsconfig.json": {
                    "types": ["node"]
                }
            }
        },
        "@somescope/project2": {
            "configs": {
                "package.json": {
                    "description": "some command line tool for node",
                    "bin": {
                        "project2-command": "./distribution/project2-command.js"
                    },
                    "devDependencies": [
                        "@types/node"
                    ]
                },
                "tsconfig.json": {
                    "types": ["node"]
                }
            }
        }
    }
}
```

## What it does

The config represents a centralized place to store info about a typescript monorepo. Upon change detection of this config file, this tool will
1. Validate the config and proceed only if valid.
1. Create package folder with package.json & tsconfig.json . TODO: support arbitrary configs
1. Update existing configs if already present.
1. Update tsconfig-leaves.json, which is a json that resides in the root of the project and contains references to all leaf projects (leaf projects are not a dependency of any other package).
1. Update lerna.json
1. Run `lerna bootstrap` to setup correct linkages between packages and install added dependencies
1. Restart a `tsc -b --watch` process that builds all packages in the tsconfig-leaves.json incrementally, therefore building all the packages in correct order.

The generated tsconfig.json and package.json files from this tool in each package directory are deep merges of the baseConfig object and config object of individual project, with 2 major sets of exceptions to this rule: 
1. the behavior of merging "package.json" files' "dependencies", "devDependencies", "peerDependencies" fields is not exactly an array merge. Instead,
the latest versions of the packages listed are always used (fetched from npm), unless the package name is from the monorepo, in which case the lerna version is used.
1. The tsconfig.json files generated contain references that point to dependency projects' relative paths and contain mandatory enabled compiler options that must be used to enable typescript project references. See the next section for specifics on these options.

## It's Opinionated

This tool is very opinionated in how a monorepo is managed.  
1. TypeScript build watch is used.
1. TypeScript project references are used.
1. Changes to individual package.jsons and tsconfig.jsons will be overwritten during the sync process, so individual settings must be controlled via the centralized config.
1. All packages will live as direct children under the directory specificed by the `packageRoot` property, unless they are a packaged with a scoped name,
in which case they will live as a direct child of a folder which is named after the scope, then that folder is a direct child of the `packageRoot`.
1. The project forces single versioning across all packages in the monorepo.
1. Certain tsconfig compilerOptions will be enabled without your choice. They are: "composite", "declaration", "declarationMap", "sourceMap". The reasoning behind this is [here](https://github.com/RyanCavanaugh/learn-a#tsconfigsettingsjson). 

## Nice benefits

1. Now all of your configs are generated from this one `ts-monorepo.json` file, and so the tsconfig.json and package.json files can go in the root level `.gitignore` since they are now all managed/generated automatically.
1. Now new package setup in the monorepo is very quick; just add a new entry to config file's `packages` object and the tool which watches the config file for saves will create all the folders, install dependencies, and add it to the incremental build process as you update the entry. Essentially this is declarative programming of all the monorepo's build configuration and dependency installation/wiring.
1. This is a better alternative to tsconfig's own extends functionality, because:
    1. All items are inherited, not just compilerOptions
    1. Arrays are unioned together rather than the child's array replacing the parent config's array, leading to less config repetition.
    1. When specifying relative paths in the ts-monorepo config, they are copied as plaintext to each package's tsconfig, meaning you can for example have all packages use the same folders for source and distribution without needing to specify this in each leaf tsconfig, whereas when doing this with tsconfig's own `extends` field, the relative paths would be relative to the path of the inherited tsconfig file rather than the project's tsconfig file, which is undesireable in most circumstances I have encountered.

## An Example?

I created this project to manage [skoville/webpack-hot-module-replacement](https://github.com/skoville/webpack-hot-module-replacement). Notice in that example how there is just one package.json for the root and ts-monorepo.json, and how none of the packages in the monorepo have their package.json or tsconfig.json files saved to the git repo.

## TODO

1. create VSCode extension which understands this config file, showing errors, auto suggesting values, and click to go to npm or other package support.
1. Allow comments in config file.
1. Specify protocol for package configs to remove certain entries from inherited baseConfig.
1. Ideally make lerna irrelevant here, taking over npm publishing capabilities.
1. Support independent versioning? Not sure if this is a good feature or not.