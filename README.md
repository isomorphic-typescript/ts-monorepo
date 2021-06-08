This is a tool which watches a configuration file named `ts-monorepo.json` which resides in the project root.

The file represents a centralized place to store [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) configuration details about all the npm packages within your typescript monorepo.

# How do I use it?

Install it (Yarn Required):<br />
- `yarn set version berry`
- `yarn add -D @isomorphic-typescript/ts-monorepo`
- `yarn ts-monorepo`

# VSCode doesn't understand my types!

This is because ts-monorepo uses Yarn v2 (Berry), which uses Plug-n-Play

- `yarn add -D typescript`
- `yarn add -D @yarnpkg/pnpify`
- `yarn pnpify --sdk vscode`
- In bottom right corner of VSCode click on the version, switch to pnpify version.
- Install the [ZipFS VSCode extension](https://marketplace.visualstudio.com/items?itemName=arcanis.vscode-zipfs) so you can go to definition for dependencies which are now all in zip files.

# What is it?

Upon change detection of `ts-monorepo.json`, this tool will
1. Validate the config and proceed [iff](https://en.wikipedia.org/wiki/If_and_only_ifs) valid.
1. Create package folder, required parent folder(s), package.json, & tsconfig.json files if any of these are missing.
1. Update the existing config files if they were already present.
1. Update or create a `tsconfig-leaves.json` file, which is a json that will reside in the root of your project, and contains references to all leaf projects (leaf projects are not a dependency of any other package).
1. Update Yarn 2 `workspaces` field in root-level `package.json` to reference all your packages, and ensure root-level `package.json` is private
1. Restart a `tsc -b --watch` process that builds all packages referenced in `tsconfig-leaves.json` incrementally, therefore building all the packages in correct order.

## It's Opinionated

This tool is very opinionated in how a monorepo is managed:
1. TypeScript build watch is used.
1. TypeScript project references are used.
1. Changes to individual package.jsons and tsconfig.jsons will be overwritten during the sync process, so individual settings must be controlled via the centralized config.
1. The project forces single versioning across all packages in the monorepo.
1. Certain tsconfig compilerOptions will be enabled without your choice. They are: "composite", "declaration", "declarationMap", "sourceMap". The reasoning behind this can be seen [here](https://github.com/RyanCavanaugh/learn-a#tsconfigsettingsjson). 

In order to view an example of how to structure `ts-monorepo.json`, please look at the same file in this repo, as ts-monorepo is maintained using ts-monorepo. Also look [here](https://github.com/skoville/webpack-hot-module-replacement/blob/master/ts-monorepo.json) to see how you can use templates. Basically you can declare as many templates as you want which are snippets of reusable config that can be included in the config files of some packages but not others.

The generated tsconfig.json and package.json files from this tool in each package directory are a [deepmerge](https://www.npmjs.com/package/deepmerge) of all templates it extends and the leaf config for the package except for the following major caveats:

<ol>
<li> 

the behavior of merging a `package.json` file's `dependencies`, `devDependencies`, and `peerDependencies` object is first an array merge to get the combined set of dependencies, then a transformation of this array into a valid npm dependency object where each package name refers to the most up-to-date version of that package.
 
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
 
 The generated file will rearrange the entries alphabetically, and you will implicitly keep all dependencies throughout your entire monorepo up to date by using this tool. If a package within the dependency array is equal to a package name managed within your monorepo, then the version will be the monorepo version and Yarn 2 will ensure the workspace version is used rather than the npm version of the package. If you want to specify specific versions you can write out dependencies like this

 ```json
"dependencies": [
    ["typescript", "4"],
    "react",
    "ansicolor"
]
 ```

 which results in the `typescript` package having that specific semver, but the other dependencies being set to the latest versions in the generated `package.json`:

 ```json
"dependencies": { 
    "ansicolor": "^1.1.89",
    "react": "^16.8.6",
    "typescript": "4"
 }
 ```
</li>
<li> The tsconfig.json files generated contain references that point to dependency projects' relative paths and contain mandatory enabled compiler options that must be used to enable typescript project references to work properly. See the next section for specifics on these options.
</li>
</ol>

Some notes should be said about how the folder structure is setup. Take note of [this project](https://github.com/skoville/webpack-hot-module-replacement/blob/master/ts-monorepo.json). Basically the following in `ts-monorepo.json`

```json
"packages": {
    "@scope": {
        "some": {
            "package~": {
                ...
            }
        }
    }
}
```

results in the following folder structure:

```
monorepo-root/
|_packages/
  |_@scope/
    |_some/
      |_package~/
        |_package.json
        |_tsconfig.json
        |_source/
          |_...
        |_build/
          |_...
```

The generated package name will be `@scope/somepackage`. You can include separator characters in the json folder segments, and these segment chars will show up in the generated package name but not in the folder names. So for example, we could have the following alternate config in `ts-monorepo.json`

```json
"packages": {
    "@scope": {
        "so": {
            ".me": {
                "-package~": {
                    ...
                }
            }
        }
    }
}
```

and we'd get the following folder structure

```
monorepo-root/
|_packages/
  |_@scope/
    |_so/
      |_me/
        |_package~/
          |_package.json
          |_tsconfig.json
          |_source/
            |_...
          |_build/
            |_...
```

And a package name of `@scope/so.me-package`.

You need to put a `~` character at the end of the folder segment to mark the termination of a package name which will cause the validation algorithm to ensure the contained attributes make up a valid package config. The tilde shows up in the folder structure to help you identify packages in your IDE, but the tilde doesn't show up in the package name because that's not even a valid package name character.

Another thing to note is that the first layer under `packages` needs to either be some valid scope (starts with `@`) or the literal string `global-scope` meaning that your package is under no scope.

I know this setup for packages folder structure is very heavy-handed (too strict). After thinking about this a lot I'll likely be removing all these restrictions in the next iteration as I plan to move in a direction where [git worktrees](https://git-scm.com/docs/git-worktree) are used instead of all the code being in a single repo, where there's a `ts-worktree.json` which specifies how the packages folders map to the various git repos, and then each package is a git repo with its own `ts-workspace.json` which defines the `package.json`, `tsconfig.json`, `.npmignore` and soon many other types of config files. This in some ways is a regression since we have more files again, but on the plus-side we'll move towards having templates be shareable packages, meaning that we can move towards a place where instead of having boilerplate repos which you clone, you just `extends` a popular config package from npm and `ts-monorepo` will set up all the config for you based on that package's published `ts-workspace.json`, and we'll still get all the benefits of ts project references for free. This seems like the most scalable long-term approach for companies with many teams where the idea of a monorepo doesn't really make sense. I'll be using this strategy to publish canonical typescript, react, react-native, and electron `ts-workspace` templates.

## Why did ts-monorepo switch to Yarn 2 from Lerna?

Lerna is too problematic in the way it manages a separate `node_modules` folder for each monorepo package, and will allow any monorepo package to use a dependency if it's a part of the monorepo's root `node_modules`. Meanwhile Yarn 2 perfectly hoists all packages across the monorepo, never stores a duplicate copy of a pakcage, and strictly ensures that a program only has access to the dependencies explicitly declared in package.json as a direct or transitive dependency. Yarn 2 is clearly the future, and Plug n Play adoption should be encouraged.

## Nice benefits

1. Now all of your configs are generated from this one `ts-monorepo.json` file, and so the tsconfig.json and package.json files can go into `.gitignore` since they are now all managed/generated automatically as part of the build, watch process, leading to a cleaner repo.
1. Now new package setup in the monorepo is very quick; just add a new entry to config file's `packages` object and the tool which watches the config file for saves will create all the folders, install dependencies, and add it to the incremental build process as you update the entry. Essentially this is declarative programming of all the monorepo's build configuration and dependency installation/wiring.
1. This is a better alternative to tsconfig's own extends functionality, because:
    1. All items are inherited, not just `compilerOptions`
    1. Arrays are unioned together rather than the child's array replacing the parent config's array, leading to less config repetition.

## Any Examples?

I created this project to manage [skoville/webpack-hot-module-replacement](https://github.com/skoville/webpack-hot-module-replacement). Notice in that project how there is just one package.json and a ts-monorepo.json in the root of the project, and how besides those two config files, there are no others throughout the remainder of the monorepo. This is great! And the autosyncing on every ts-monorepo.json change saves me a great deal of time.

## Maintainer's Quick Start

If you want to submit a PR to improve this project, then after cloning

```
git clone git@github.com/isomorphic-typescript/ts-monorepo
```

run

```bash
yarn add -D typescript
yarn add -D @yarnpkg/pnpify
yarn pnpify --sdk vscode
```

then run `yarn build:stable` for an initial install and build of the rapid package.
After the build is successful, stop the stable build process and start running `yarn build:rapid` instead so the version of tsmonorepo being used to build tsmonorepo is the version you are actively modifying. This way you can test your changes real-time as you code. If you ever make a mistake in rapid mode, you can always revert back to stable build mode until your modifications are functional again.

If the stable command initially fails you may need to temporarily remove this entry in the package.json:

```json
"@isomorphic-typescript/ts-monorepo": "portal:./packages/@isomorphic-typescript/ts-monorepo~",
```

then run `yarn install`, then run `yarn build:stable`

Once you are satisfied with your changes, submit a PR. We have a github action which will automatically run the packaging and publishing steps if the PR is merged.

## Maintainers' Tenets

1. The entire interface of this tool will be through options within the ts-monorepo.json file, meaning the CLI will never have any arguments or take parameters through the command prompt. No exceptions to this rule shall ever be allowed. Think hard about out how you can add feature **XYZ** through a new json option instead. Hold up your right hand and repeat after me: 

> As a maintainer, I vow to reject PRs which try to add command line arguments.

## TODO

1. create VSCode extension which understands this config file, showing errors, auto suggesting values, and click to go to npm or other package support.
1. Create a demo gif for the README.
1. Improve quality of error messages
1. Support independent versioning? Not sure if this is a good feature or not.
1. Make the sync protocol more generic so as to support any arbitrary config or make it easy for maintainers to PR for new types of config files.
1. Move towards git worktrees, and have each package publish its own `ts-workspace.json` so that published packages can share config which can become an alternative standard which replaces boilerplate code repos.