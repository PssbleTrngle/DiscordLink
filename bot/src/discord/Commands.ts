import Config from "../models/Config";
import { Message } from "discord.js";
import { debug } from "../logging";
import chalk from "chalk";

interface Parameters {
    [key: string]: string;
}

interface Command {
    help?: (config: Config) => string;
    parameters?: Parameters;
    execute: (config: Config, params: any) => Promise<string> | string
}

function helpMessage(config: Config, { help, parameters }: Command, identifier: string) {
    const params = parameters ? Object.keys(parameters).map(p => `*${p}*`).join(' ') : '';
    const usage = `**Usage**    ${config.prefix}${identifier} ${params}`
    const h = help ? help(config) : null;
    return ['', usage, h].filter(l => l !== null).join('\n')
}

export function execute({ content, channel, author }: Message, config: Config) {
    if (content.startsWith(config.prefix)) {

        const cmd = content.substring(config.prefix.length, content.length);
        debug(`Executed command ${chalk.underline(cmd)}`);

        const [identifier, ...args] = cmd.split(' ').map(s => s.trim());
        const command = Commands[identifier];

        if (command) {

            const parameters = command.parameters ?? {};

            try {
                const parsedArgs = Object.keys(parameters)
                    .map((p, i) => ({ key: p, value: args[i] }))
                    .reduce((o, { key, value }) => ({ ...o, [key]: value }), {});

                debug(`Arguments`, parsedArgs);

                Promise.resolve(command.execute(config, parsedArgs)).then(
                    feedback => channel.send(`<@${author.id}> ${feedback}`))


            } catch (e) {
                channel.send(`<@${author.id}> ${e.message}`)
            }

        } else channel.send(`<@${author.id}> unknown command '${identifier}'`)

        return true;
    }

    return false;
}

const Commands: { [key: string]: Command } = {
    help: {
        parameters: {
            command: ''
        },
        execute: (config, { command }) => {
            const c = Commands[command];
            if (!c) throw new Error(`Unkown command '${command}'`);
            return helpMessage(config, c, command)
        }
    },
    config: {
        parameters: {
            key: '',
            value: '',
        },
        help: c => c.descriptions()
            .map(key => `*${key}*: ${c.getDescription(key)}`)
            .join('\n'),
        execute: async (config, { key, value }) => {
            if (key in config)
                //@ts-ignore
                config[key] = value;
            await config.save();
            return 'Changed config';
        }
    },
}