import * as ansicolor from 'ansicolor';

export function constructPresentableConfigObjectPath(configObjectPath: string[]): string {
    return configObjectPath.map(key => `${ansicolor.lightYellow('[')+ansicolor.lightCyan(key)+ansicolor.lightYellow(']')}`).join("");
}