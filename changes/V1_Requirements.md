# V1 Requirements/Roadmap.

This document outlines the planned changes from V0 to V1.

## Initial added features

<table>

<tr>
<th>Done?</th>
<th>Description</th>
</tr>

<tr>
<td>
<input type="checkbox" />
</td>
<td>
When specifying dependencies, either include the name in the array for the tool to determine latest version, or put an object in the array which allows you to define the version.

```typescript
type DependencyEntry = string | {package: string, version: string};
```
</td>
</tr>

<tr>
<td>
<input type="checkbox" />
</td>
<td>
ts-monorepo will take over the bootstrap and hoist responsibilities from lerna, such that there is only one instance of each package stored on disk between all projects of the monorepo. It will also use symlinking such that the node_modules folder of each project reflects how it would be structured after a normal <code>npm install</code> rather than linked projects containing a node_modules which has all its dependencies and dev dependencies inside
</td>
</tr>

<tr>
<td>
<input type="checkbox" />
</td>
<td>
Now instead of having base configs of tsconfig.json and package.json only, it should be basePackageConfigs which is a map from template name to template (renaming this option from <code>basePackageConfigs</code> to <code>templates</code>). Each template then has configs for tsconfig.json, package.json, other config files/objects, plus options unique to a ts-monorepo package. Having multiple templates means that package config must now extend its base explicitly by name (or extend nothing). Each package config will have an <code>extends</code> field which is an ordered array of template names. The templates will be applied in the given order, with later entries overwriting earlier ones during deep merge. Finally the package config itself will act as the final overwrite. In addition to package configs being able to extend templates, templates will also be able to extend other templates. ts-monorepo will ensure that no circular template dependencies exist.
</td>
</tr>

<tr>
<td>
<input type="checkbox" />
</td>
<td>
For cases where many packages begin with the same prefix (i.e. "webpack-hmr-one", "webpack-hmr-two", "webpack-hmr-three", etc.), a hierarchy of folders may now be used to organize the monorepo on disk. Under <code>monorepo</code> an object will either be a <code>SubPackageConfig</code> or a <code>PackageConfig</code>. A <code>SubPackageConfig</code> will have the fields <code>children</code>, <code>delimiter</code>, and <code>package</code>. <code>children</code> attribute is a map from name to more package or subpackage configs. <code>delimiter</code> is an option within a subpackage config which will be a series of characters which are used to join the existing package name up until that point with the names of the package configs belonging to the given subpackage config. Finally, <code>package</code> allows for the monorepo to have a package named <code>my-project</code> and <code>my-project-helpers</code> at the same time. Note that this config strategy allows for the possibility of multiple config structures to resolve to the same package name. In these cases ts-monorepo will ensure each package name is only resolved to once, also taking into account <a href="https://www.cyberciti.biz/faq/linuxunix-rules-for-naming-file-and-directory-names/">npm's moniker rules</a> when evaluating equivalence.
</td>
</tr>

</table>

On top of these new features I plan on removing the following:

1. No more `packageRoot` option. It will be `monorepo` without the ability to change that.
1. No more `publishDistributionFolder` option. This will be enabled for all packages.
1. The `rootDir` and `outDir` compiler options in tsconfig can no longer be customized. They will automatically be `./source` and `./distribution` respectively. Also `include` will be auto forced to contain `"source/**/*"`

The theme here is embracing convention over configuration, without limiting possibilities of what can be done with other tools. With that in mind here's one more convention which will be added:

1. The first level under `monorepo` will be a map from scope name to `PackageConfig|SubpackageConfig`; the first level may not contain package names, only scope names. For any package which should not be under any scope, it will be mandated that the literal string `global-scope` is used.

## Features which will not immediately be part of V1:

<ol>
<li>
Give packages the ability to set their own version if desired.
</li>
<li>
Add VSCode extension to recognize the structure, allow comments, validate package names, and have go to link from package name to reference on npm, within config file, or within monorepo. Have a clickable link next to monorepo versions to bump up by patch, minor, or major version, and show how that version in the monorepo config file differs from what is currently published to npm.
</li>
</ol>

## What will ts-monorepo.json look like after this is all over?

Here's an example which includes the described changes

```jsonc
{
    "ttypescript": true,
    "cleanBeforeCompile": false,
    "packageTemplates": {
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

The resulting directory structure would look like this:

```

```