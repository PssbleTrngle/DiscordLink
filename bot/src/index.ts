import * as bodyParser from "body-parser";
import chalk from "chalk";
import express, { NextFunction } from "express";
import { Request, Response } from 'express-serve-static-core';
import "reflect-metadata";
import { createConnection } from "typeorm";
import config from '../ormconfig';
import { debug, error, success } from "./logging";
import { Routes } from "./routes";
import DiscordBot from "./discord/Bot";

export function exists<T>(t: T | undefined | null): t is T {
    return (t ?? null) != null
}

export type ApiFunc = (req: Request, res: Response, next: NextFunction) => unknown;

export class HttpError extends Error {
    constructor(public status_code: number, message?: string) {
        super(message);
    }
}

export const DEBUG = process.env.NODE_ENV === 'development';

const { DISCORD_BOT_TOKEN } = process.env;
if (!DISCORD_BOT_TOKEN) throw new Error('No bot token defined');

export const Bot = new DiscordBot(DISCORD_BOT_TOKEN);

createConnection(config as any).then(async connection => {

    connection.synchronize();

    // create express app
    const app = express();
    app.use(bodyParser.json());

    function wrapper(func: ApiFunc): ApiFunc {
        return async (req, res, next) => {
            try {
                const r = func(req, res, next);
                const result = r instanceof Promise ? await r : r;

                if (result !== void 0) {
                    if (!!result) {

                        if (typeof result === 'number') {
                            res.status(result).send();
                        } if (result === true) {
                            res.status(200).send();
                        } else if (typeof result === 'object') {
                            res.json(result);
                        } else {
                            res.send(result);
                        }

                    } else {
                        res.status(404).send('Not found');
                    }
                } else {
                    next();
                }

            } catch (e) {

                const status_code = e.status_code ?? 500;
                if (status_code === 500 && DEBUG) {
                    error('Controller encountered unwanted error:')
                    error(e.message);

                    if (e.isAxiosError && e.response) {
                        error(e.response?.data);
                    }
                }

                res.status(status_code).send(e.message ?? 'Internal server error');
            }
        }
    }

    // register express routes from defined application routes
    Routes.forEach(({ controller, action, route, method }) => {

        const c = new controller();

        (app as any)[method](route, wrapper((req: Request, res: Response, next: Function) => {
            debug(`[${method.toUpperCase()}] -> '${route}'`);
            return c[action](req, res, next);
        }));
    });


    const PORT = process.env.PORT ?? 8080;
    app.listen(PORT, () => {
        success(`Server started on port ${chalk.underline(PORT)}`);
        console.log();
    });

    await Bot.run();

}).catch(error => console.log(error));
