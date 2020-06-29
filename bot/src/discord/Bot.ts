import { Client, DMChannel, Guild, Message, TextChannel, User } from 'discord.js';
import Config from '../models/Config';
import Link from '../models/Link';
import LinkRequest from '../models/LinkRequest';
import Server from '../models/Server';
import { execute } from './Commands';
import ServerLinkRequest from '../models/ServerLinkRequest';
import { HttpError, Bot, exists } from '..';
import { debug } from 'console';

class DiscordBot {

    private client = new Client();

    async isOnServer(id: string) {
        return this.client.guilds.cache.has(id) || !!this.client.guilds.resolve(id);
    }

    async sendServerLinkRequest(id: string, server: Server) {
        const guild = this.client.guilds.resolve(id);
        if (guild) {
            const owner = this.client.users.resolve(guild.ownerID);
            owner?.send(`Your discord server **${guild.name}** has been asked to link to the minecraft server ${server.address ?? '*Unkown*'}\Enter accept\` or \`decline\``);
            return owner?.id;
        } else throw new HttpError(400, 'The bot has not yet been added to this server');
        return null;
    }

    async updateActivity() {
        const servers = await Server.count();
        //const online = Server.count({ running: true });
        const links = await Link.count();
        await this.client.user?.setActivity(`${links} users on ${servers} servers`);
    }

    getUser() {
        return this.client.user;
    }

    constructor(private token: string) {

        this.client.on('message', msg => {
            if (msg.author.bot) return;

            function isDM(msg: Message): msg is Message & { channel: DMChannel } {
                return msg.channel.type === 'dm';
            }

            function isText(msg: Message): msg is Message & { channel: TextChannel } {
                return msg.channel.type === 'text';
            }

            if (isDM(msg)) this.handleDM(msg);
            else if (isText(msg)) this.handleServerMessage(msg);

        })

        const events = ['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'];
        events.forEach(e => process.on(e, () => {
            debug('Going dark');
            console.log(this.client.user);
            this.client.user?.setActivity('')
            this.client.user?.setStatus('invisible')
        }));

    }

    async getConfig(guild: Guild) {
        const serverId = guild.id;
        const existing = await Config.findOne({ serverId });
        if (existing) return existing;
        return Config.create({ serverId }).save();
    }

    async handleServerMessage(msg: Message & { channel: TextChannel }) {
        if (!msg.guild) throw new Error('Message without server information');
        const config = await this.getConfig(msg.guild)

        execute(msg, config)
    }

    hasRole(guild: Guild, user: User, role: string) {
        return guild?.roles.resolve(role)?.members.has(user.id)
    }

    async handleDM(msg: Message & { channel: DMChannel }) {

        const tag = msg.author.tag;
        const key = msg.content;
        const discordId = msg.author.id

        const request = await LinkRequest.findOne({ tag });

        if (request) {

            const valid = request.verify(key);
            if (valid) {

                const { uuid, username } = request;
                await Link.create({ discordId, uuid }).save();
                msg.channel.send(`Your account has been linked with \`${username}\``)

                LinkRequest.createQueryBuilder()
                    .where('uuid = :uuid', { uuid })
                    .orWhere('tag = :tag', { tag })
                    .delete();

            } else {
                const server_request = await ServerLinkRequest.findOne({ ownerId: msg.author.id });
                if (server_request) {
                    switch (msg.content.toLowerCase().trim()) {
                        case 'accept': {
                            server_request.server.discordId = server_request.discordId;
                            await server_request.server.save();
                            await server_request.remove();
                            msg.author.send('Your discord server is now linked')
                            break;
                        }
                        case 'decline': {

                            msg.author.send('Declined request')
                            break;
                        }
                        default: msg.author.send('Invalid option')
                    }
                }
            }

        } else msg.channel.send('There is no link request open for this account')


    }

    async joined(userId: string, serverId: string) {
        const guild = this.client.guilds.resolve(serverId);
        const user = guild?.members.resolve(userId);

        if (user && guild) {
            const config = await this.getConfig(guild);
            [config.joinedRole, config.onlineRole]
                //.map(role => role ? guild.roles.resolve(role) : null)
                .filter(exists)
                .forEach(role => user.roles.add(role))
        }
    }

    async left(userId: string, serverId: string) {
        const guild = this.client.guilds.resolve(serverId);
        const user = guild?.members.resolve(userId);

        if (user && guild) {
            const { onlineRole } = await this.getConfig(guild);
            if (onlineRole) user.roles.remove(onlineRole);
        }
    }

    async fetchDiscordUser(id: string) {
        return this.client.users.fetch(id, true);
    }

    async run() {
        await this.client.login(this.token)
        this.updateActivity();
    }

}

export default DiscordBot;