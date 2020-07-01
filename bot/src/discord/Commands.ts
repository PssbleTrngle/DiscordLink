import Config from "../models/Config";
import { Message, User, Guild, GuildMember } from "discord.js";
import { debug } from "../logging";
import chalk from "chalk";
import { Bot } from "..";
import { allowedNodeEnvironmentFlags } from "process";
import { ConnectionOptionsReader } from "typeorm";
import Server from "../models/Server";
import Link from "../models/Link";
import UserCache from "../minecraft/UserCache";
import DiscordBot, { IEmbed } from "./Bot";

interface Parameters {
    [key: string]: {
        description: string,
        optional?: boolean,
    };
}

type CommandReturn = string | IEmbed;

interface Command {
    help?: (config: Config) => string | string[];
    parameters?: Parameters;
    execute: (config: Config, params: any, message: Message) => Promise<CommandReturn> | CommandReturn
}

function helpMessage(config: Config, { help, parameters }: Command, identifier: string): CommandReturn {
    const params = parameters ? Object.keys(parameters).map(p => `*${p}*`).join(' ') : '';
    const usage = `Usage: ${config.prefix}${identifier} ${params}`
    const h = help ? help(config) : undefined;
    return { title: usage, message: h, level: 'info' }
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

class CommandError extends Error {

}

async function callCommand(message: Message, command: Command, args: string[], config: Config) {
    const { author, channel } = message;

    const parameters = command.parameters ?? {};

    try {
        const parsedArgs = Object.keys(parameters)
            .map((key, i) => {
                const param = parameters[key];
                const value = args[i];
                if (!value && !param.optional) throw new CommandError(`Missing argument *${key}*`)
                return { key, value };
            })
            .reduce((o, { key, value }) => ({ ...o, [key]: value }), {});

        const feedback = await command.execute(config, parsedArgs, message);
        if (typeof feedback === 'string') Bot.sendMessage(channel, { level: 'success', title: feedback })
        else Bot.sendMessage(channel, { level: 'success', ...feedback })

    } catch (e) {
        if (e instanceof CommandError) Bot.sendMessage(channel, { level: 'error', title: 'Incorrect command', message: e.message, user: author });
        else {
            Bot.sendMessage(channel, { level: 'error', title: 'An error occured', user: author });
            Bot.logError(e, config);
        }
    }
}

export function execute(message: Message, config: Config) {
    const { channel, author } = message;

    const cmd = getCommand(message, config);

    if (cmd) {

        const [identifier, ...args] = cmd.split(' ').map(s => s.trim());
        const command = Commands[identifier];

        if (command) {
            Bot.log(config, 'debug', `**${author.tag}** executed command`, cmd)
            callCommand.call(Bot, message, command, args, config)
                .catch(e => Bot.logError(e, config));
        }
        else Bot.sendMessage(channel, { level: 'error', title: 'Unknown command', user: author });

        return true;
    }

    return false;
}

async function parseUser(text: string, guild?: Guild | null) {
    const id = text.match(/<@!*(.+)>/);

    if (id) return guild?.members.resolve(id[1])?.user ?? undefined;
    if (guild) {
        const fetched = await guild.members.fetch({ query: text })
        return fetched.first()?.user;
    }
    return undefined;
}

const Commands: { [key: string]: Command } = {
    help: {
        parameters: {
            command: {
                description: 'The command you want help with',
                optional: true,
            }
        },
        execute: async (config, { command }) => {
            if (!command) return {
                level: 'info',
                title: 'Link Discord and Minecraft accounts',
                fields: {
                    'Info    :book:': '[More Information](https://github.com/PssbleTrngle/DiscordLink/blob/master/README.md)',
                    'Mod    :file_folder:': 'Download the mod',
                    'Bot    :door:': `[Invite me to your own server](${await Bot.invite()})`,
                }
            };

            const c = Commands[command];
            if (!c) throw new CommandError(`Unkown command '${command}'`);
            return helpMessage(config, c, command)
        }
    },
    config: {
        parameters: {
            key: {
                description: 'The config key'
            },
            value: {
                description: 'The new value',
                optional: true,
            },
        },
        help: c => c.descriptions().map(key => `*${key}*: ${c.getDescription(key)}`),

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
                } else throw new CommandError(`\`${key}\` is not a valid config key`);

            } else throw new CommandError('You are not authorized');
        }
    },
    user: {
        help: () => 'Find the linked minecraft account of a user',
        parameters: {
            user: {
                description: 'The discord user'
            }
        },
        execute: async (_, { user }, { guild }) => {
            const discordUser = await parseUser(user, guild);
            const link = await Link.findOne({ discordId: discordUser?.id });
            if (link) {
                const username = await UserCache.getUsername(link.uuid);
                return { title: `User is linked to \`${username ?? link.uuid}\``, author: discordUser, level: 'info' };
            } else return { title: 'User has has not linked their minecraft account', author: discordUser, level: 'warning' }
        },
    },
    server: {
        help: () => 'The linked server ip adress',
        execute: async config => {
            const server = await Server.findOne({ discordId: config.serverId })
            if (server) {
                if (server.address) return `This servers IP is ${server.address}`
                else return 'This servers IP is unknown'
            } else throw new CommandError('There is no minecraft server linked to this discord')
        }
    }
}