import chalk from 'chalk';

const logColor = (func: Function, s: any[]) => console.log(...s.map(s => typeof s === 'string' ? func(s) : s))

export const error = (...s: unknown[]) => logColor(chalk.red, ['❌', ...s]);
export const info = (...s: unknown[]) => logColor(chalk.cyanBright, [...s]);
export const success = (...s: unknown[]) => logColor(chalk.greenBright, ['✔', ...s]);
export const warn = (...s: unknown[]) => logColor(chalk.yellow, ['⚠', ...s]);
export const debug = (...s: unknown[]) => {
    if (process.env.NODE_ENV === 'development') logColor(chalk.bgGray.white, s)
}