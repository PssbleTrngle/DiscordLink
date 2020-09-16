import { Guild, Message } from "discord.js";
import { Bot } from "..";
import { error } from "../logging";
import UserCache from "../minecraft/UserCache";
import Link from "../models/Link";
import { IEmbed } from "./Bot";

export const prefix = process.env.PREFIX || '$'

interface Parameters {
    [key: string]: {
        description: string,
        optional?: boolean,
    };
}

type CommandReturn = string | IEmbed;

interface Command {
    help?: () => string | string[];
    parameters?: Parameters;
    execute: (params: any, message: Message) => Promise<CommandReturn> | CommandReturn
}

function helpMessage({ help, parameters }: Command, identifier: string): CommandReturn {
    const params = parameters ? Object.keys(parameters).map(p => `*${p}*`).join(' ') : '';
    const usage = `Usage: ${prefix}${identifier} ${params}`
    const h = help ? help() : undefined;
    return { title: usage, message: h, level: 'info' }
}

function getCommand({ content, mentions }: Message) {
    const bot = Bot.getUser()?.id;
    if (bot && mentions.users.has(bot)) {
        console.log(bot);
        return content.replace(new RegExp(`<@!*${bot}>`), '').trim();
    } else if (content.startsWith(prefix)) {
        return content.substring(prefix.length, content.length);
    }

    return null;
}

class CommandError extends Error {

}

async function callCommand(message: Message, command: Command, args: string[]) {
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

        const feedback = await command.execute(parsedArgs, message);
        if (typeof feedback === 'string') Bot.sendMessage(channel, { level: 'success', title: feedback })
        else Bot.sendMessage(channel, { level: 'success', ...feedback })

    } catch (e) {
        if (e instanceof CommandError) Bot.sendMessage(channel, { level: 'error', title: 'Incorrect command', message: e.message, user: author });
        else Bot.sendMessage(channel, { level: 'error', title: 'An error occured', user: author });

    }
}

export function execute(message: Message) {
    const { channel, author } = message;

    const cmd = getCommand(message);

    if (cmd) {

        const [identifier, ...args] = cmd.split(' ').map(s => s.trim());
        const command = Commands[identifier];

        if (command) {
            callCommand.call(Bot, message, command, args)
                .catch(e => error(e.message));
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
        execute: async ({ command }) => {
            if (!command) return {
                level: 'info',
                title: 'Link Discord and Minecraft accounts',
                fields: {
                    'Info    :book:': '[More Information](https://github.com/PssbleTrngle/DiscordLink/blob/master/README.md)',
                    'Mod    :file_folder:': '[Download the mod](https://www.curseforge.com/minecraft/mc-mods/discord-link)',
                    'Bot    :door:': `[Invite me to your own server](${await Bot.invite()})`,
                }
            };

            const c = Commands[command];
            if (!c) throw new CommandError(`Unkown command '${command}'`);
            return helpMessage(c, command)
        }
    },
    user: {
        help: () => 'Find the linked minecraft account of a user',
        parameters: {
            user: {
                description: 'The discord user'
            }
        },
        execute: async ({ user }, { guild }) => {
            const discordUser = await parseUser(user, guild);
            const link = await Link.findOne({ discordId: discordUser?.id });
            if (link) {
                const username = await UserCache.getUsername(link.uuid);
                return { title: `User is linked to \`${username ?? link.uuid}\``, author: discordUser, level: 'info' };
            } else return { title: 'User has has not linked their minecraft account', author: discordUser, level: 'warning' }
        },
    }
}