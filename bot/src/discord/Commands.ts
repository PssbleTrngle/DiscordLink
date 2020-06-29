import Config from "../models/Config";
import { Message, User, Guild } from "discord.js";
import { debug } from "../logging";
import chalk from "chalk";
import { Bot } from "..";
import { allowedNodeEnvironmentFlags } from "process";
import { ConnectionOptionsReader } from "typeorm";
import Server from "../models/Server";
import Link from "../models/Link";
import UserCache from "../minecraft/UserCache";

interface Parameters {
    [key: string]: string;
}

interface Command {
    help?: (config: Config) => string;
    parameters?: Parameters;
    execute: (config: Config, params: any, message: Message) => Promise<string> | string
}

function helpMessage(config: Config, { help, parameters }: Command, identifier: string) {
    const params = parameters ? Object.keys(parameters).map(p => `*${p}*`).join(' ') : '';
    const usage = `**Usage**    ${config.prefix}${identifier} ${params}`
    const h = help ? help(config) : null;
    return ['', usage, h].filter(l => l !== null).join('\n')
}

function getCommand({ content, mentions }: Message, config: Config) {
    const bot = Bot.getUser()?.id;
    if (bot && mentions.users.has(bot)) {
        console.log(bot);
        return content.replace(new RegExp(`<@!*${bot}>`), '').trim();
    } else if (content.startsWith(config.prefix)) {
        return content.substring(config.prefix.length, content.length);
    }

    return null;
}

export function execute(message: Message, config: Config) {
    const { channel, author } = message;

    const cmd = getCommand(message, config);

    if (cmd) {

        debug('Executed command', chalk.underline(cmd));

        const [identifier, ...args] = cmd.split(' ').map(s => s.trim());
        const command = Commands[identifier];

        if (command) {

            const parameters = command.parameters ?? {};

            try {
                const parsedArgs = Object.keys(parameters)
                    .map((p, i) => ({ key: p, value: args[i] }))
                    .reduce((o, { key, value }) => ({ ...o, [key]: value }), {});

                Promise.resolve(command.execute(config, parsedArgs, message)).then(
                    feedback => channel.send(`<@${author.id}> ${feedback}`))


            } catch (e) {
                channel.send(`<@${author.id}> ${e.message}`)
            }

        } else channel.send(`<@${author.id}> unknown command '${identifier}'`)

        return true;
    }

    return false;
}

async function parseUser(text: string, guild?: Guild | null) {
    const id = text.match(/<@!*(.+)>/);
    if (id) return id[1];
    if (guild) {
        const fetched = await guild.members.fetch({ query: text })
        return fetched.first()?.id;
    }
    return undefined;
}

const Commands: { [key: string]: Command } = {
    help: {
        parameters: {
            command: ''
        },
        execute: (config, { command }) => {
            if (!command) return `This bot is used to link Discord accounts to Minecraft ones\nhttps://github.com/PssbleTrngle/DiscordLink/blob/master/README.md`
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
        execute: async (config, { key, value }, { author, guild }) => {
            const isOwner = author.id === guild?.ownerID;
            const onlyOwner = Config.ONLY_OWNER.includes(key);

            if (isOwner || (!onlyOwner && guild && config.adminRole && Bot.hasRole(guild, author, config.adminRole))) {

                if (config.descriptions().includes(key)) {
                    if (value) {
                        //@ts-ignore
                        config[key] = value;
                        await config.save();

                        return 'Changed config';
                    } else {
                        //@ts-ignore
                        return `Value for \`${key}\` is \`${config[key]}\``
                    }
                } else return `\`${key}\` is not a valid config key`;

            } else return 'You are not authorized';
        }
    },
    user: {
        help: () => 'Find the linked minecraft account of a user',
        parameters: { user: 'The discord user' },
        execute: async (_, { user }, { guild }) => {
            const id = await parseUser(user, guild);
            const link = await Link.findOne({ discordId: id });
            if (link) {
                const username = await UserCache.getUsername(link.uuid);
                return `User is linked to \`${username ?? link.uuid}\``;
            } else return 'User has has not linked his minecraft account'
        },
    },
    server: {
        help: () => 'The linked server ip adress',
        execute: async config => {
            const server = await Server.findOne({ discordId: config.serverId })
            if (server) {
                if (server.address) return `This servers IP is ${server.address}`
                else return 'This servers IP is unknown'
            } else return 'There is no minecraft server linked to this discord'
        }
    }
}