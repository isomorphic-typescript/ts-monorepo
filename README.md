# How do I use it?

Install it:<br />
`npm i -D @isomorphic-typescript/ts-monorepo`

Run it:<br />
`npx ts-monorepo`

# What is it?

This is a tool which watches a configuration file named `ts-monorepo.json` which resides in the project root and has the following format:

```json
{
    "packageRoot": "packages",
    "version": "0.1.2",
    "baseConfigs": {
        "package.json": {
            "author": "Alexander Leung",
            "license": "MIT"
        },
        "tsconfig.json": {
            "compilerOptions": {
                "module": "commonjs",
                "target": "es6",
                "lib": ["esnext"],
                "rootDir": "./source",
                "outDir": "./distribution"
            }
        }
    },
    "packages": {
        "project1": {
            "publishDistributionFolder": false,
            "configs": {
                "package.json": {
                    "files": ["distribution"],
                    "main": "./distribution/package.js",
                    "description": "some package for node",
                    "scripts": {
                        "custom": "project2-command input"
                    },
                    "dependencies": [
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
            "publishDistributionFolder": true,
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

The file represents a centralized place to store [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) configuration details about all the npm packages within your typescript monorepo. Upon change detection of the config file, this tool will
1. Validate the config and proceed [iff](https://en.wikipedia.org/wiki/If_and_only_ifs) valid.
1. Create package folder, required parent folder(s), package.json, & tsconfig.json files if any of these are missing.
1. Update the existing config files if they were already present.
1. Update or create a `tsconfig-leaves.json` file, which is a json that will reside in the root of your project, and contains references to all leaf projects (leaf projects are not a dependency of any other package).
1. Update `lerna.json` to reference all your packages.
1. Run `lerna bootstrap` to setup correct linkages between packages and install all their npm dependencies
1. Restart a `tsc -b --watch` process that builds all packages referenced in `tsconfig-leaves.json` incrementally, therefore building all the packages in correct order.

The generated tsconfig.json and package.json files from this tool in each package directory are a [deepmerge](https://www.npmjs.com/package/deepmerge) of the baseConfig object and config object of individual project, with 2 major caveats to this rule: 

<ol>
<li> the behavior of merging a `package.json` file's `dependencies`, `devDependencies`, and `peerDependencies` object is first an array merge to get the combined set of dependencies, then a transformation of this array into a valid npm dependency object where each package name refers to the most up-to-date version of that package.
 
 For example, this value for `"baseConfigs"`.`"package.json"`.`"devDependencies"` in `ts-monorepo.json`
 ```json
 [
    "typescript",
    "react",
    "ansicolor"
 ]
 ```
 will be transformed into this valid package.json dependency object in the package's generated package.js file
 ```json
 { 
    "ansicolor": "^1.1.89",
    "react": "^16.8.6",
    "typescript": "^3.5.2"
 }
 ```
 
 The generated file will rearrange the entries alphabetically, and you will implicitly keep all dependencies throughout your entire monorepo up to date by using this tool. If a package within the dependency array is equal to a package name managed within your monorepo, then the version will be the monorepo version and npm link will be used when installing all the dependencies.
</li>
<li> The tsconfig.json files generated contain references that point to dependency projects' relative paths and contain mandatory enabled compiler options that must be used to enable typescript project references to work properly. See the next section for specifics on these options.
</li>
</ol>

## It's Opinionated

This tool is very opinionated in how a monorepo is managed:
1. TypeScript build watch is used.
1. TypeScript project references are used.
1. Changes to individual package.jsons and tsconfig.jsons will be overwritten during the sync process, so individual settings must be controlled via the centralized config.
1. All packages will live as direct children under the directory specificed by the `packageRoot` property, unless their npm package name begins with an npm scope,
in which case they will live as a direct child of a folder which has the name of the scope, then that folder is a direct child of the vakye of the `packageRoot` property in the monorepo config file.
1. The project forces single versioning across all packages in the monorepo.
1. Certain tsconfig compilerOptions will be enabled without your choice. They are: "composite", "declaration", "declarationMap", "sourceMap". The reasoning behind this can be seen [here](https://github.com/RyanCavanaugh/learn-a#tsconfigsettingsjson). 

## Nice benefits

1. Now all of your configs are generated from this one `ts-monorepo.json` file, and so the tsconfig.json and package.json files can go into `.gitignore` since they are now all managed/generated automatically as part of the build, watch process.
1. Now new package setup in the monorepo is very quick; just add a new entry to config file's `packages` object and the tool which watches the config file for saves will create all the folders, install dependencies, and add it to the incremental build process as you update the entry. Essentially this is declarative programming of all the monorepo's build configuration and dependency installation/wiring.
1. This is a better alternative to tsconfig's own extends functionality, because:
    1. All items are inherited, not just `compilerOptions`
    1. Arrays are unioned together rather than the child's array replacing the parent config's array, leading to less config repetition.
    1. When specifying relative paths in the ts-monorepo.json baseConfig, they are copied as plaintext to each package's tsconfig, meaning you can for example have all packages use the same folders for source and distribution without needing to specify this in each leaf tsconfig, whereas when doing this with tsconfig's own `extends` field, the relative paths would be relative to the path of the inherited base tsconfig file rather than the project's tsconfig file, which is undesireable in most circumstances I have encountered.
1. [Unlike Lerna](https://github.com/lerna/lerna/issues/1282#issuecomment-387918197), you can link and publish packages from the distribution directory rather than the package root directory. To enable this, set the `publishDistributionFolder` attribute to true in a particular package config. Note that for this option to work, you must also ensure that the generated tsconfig.json contains a `compilerOptions`.`outDir` value.
1. Since this package technically composes lerna, you still use lerna commands `lerna publish` and `lerna run` explicitly, as well as `lerna bootstrap --hoist` if you like to do that. This tool does call `lerna bootstrap` internally, to set up all the linking before it begins a typescript build watch process.

## Any Examples?

I created this project to manage [skoville/webpack-hot-module-replacement](https://github.com/skoville/webpack-hot-module-replacement). Notice in that project how there is just one package.json and a ts-monorepo.json in the root of the project, and how besides those two config files, there are no others throughout the remainder of the monorepo. This is great! And the autosyncing on every ts-monorepo.json change saves me a great deal of time.

## Maintainers' Tenets

1. The entire interface of this tool will be through options within the ts-monorepo.json file, meaning the CLI will never have any arguments or take parameters through the command prompt. No exceptions to this rule shall ever be allowed. Think hard about out how you can add feature **XYZ** through a new json option instead. Hold up your right hand and repeat after me: 

> As a maintainer, I vow to reject PRs which try to add command line arguments.

## TODO

1. create VSCode extension which understands this config file, showing errors, auto suggesting values, and click to go to npm or other package support.
1. Create a demo gif for the README.
1. Allow comments in config file.
1. Improve quality of error messages
1. Specify protocol for package configs to remove certain entries from inherited baseConfig.
1. Ideally decouple project from lerna irrelevant here. Plus side is more control and faster install time. Downside is needing to take over npm publishing capabilities, run in each package capabilities, hoisting, and all this will probably mean the need to add command line arguments to the tool.
1. Support independent versioning? Not sure if this is a good feature or not.
1. Make the sync protocol more generic so as to support any arbitrary config.