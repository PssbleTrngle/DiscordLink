import { debug } from 'console';
import { Client, DMChannel, Guild, Message, NewsChannel, TextChannel, User } from 'discord.js';
import Link from '../models/Link';
import LinkRequest from '../models/LinkRequest';

const Levels = {
    info: 0x4CC7E6,
    success: 0x4CE65B,
    error: 0xE5433D,
    debug: 0x4CC7E6,
    warning: 0xFFCC33,
}

type Level = keyof typeof Levels;
export type IEmbed = {
    message?: string | string[],
    title?: string,
    user?: User,
    level?: Level,
    fields?: {
        [key: string]: string
    }
}

class DiscordBot {

    private client = new Client();

    async isOnServer(id: string) {
        return this.client.guilds.cache.has(id) || !!this.client.guilds.resolve(id);
    }

    async sendMessage(channel: DMChannel | TextChannel | NewsChannel, { message, title, user, level, fields }: IEmbed) {
        const color = Levels[level ?? 'success'];
        //const t = to ? `<@${to.id}> ${title}` : title
        const description = Array.isArray(message) ? message.join('\n') : message;

        const author = user && { icon_url: user.avatarURL(), name: user.username };

        channel.send({
            embed: {
                title, description, color, author,
                fields: fields && Object.keys(fields).map((name, i) => ({ name, value: fields[name] }))
            }
        })
    }

    invite() {
        return this.client.generateInvite(8);
    }

    emoji(name: string) {
        return this.client.emojis.resolveIdentifier(name);
    }

    async updateActivity() {
        const links = await Link.count();
        await this.client.user?.setActivity(`${links} linked users`);
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

            if (isDM(msg)) this.handleDM(msg);

        })

        const events = ['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'];
        events.forEach(e => process.on(e, () => {
            debug('Going dark');
            console.log(this.client.user);
            this.client.user?.setActivity('')
            this.client.user?.setStatus('invisible')
        }));

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
                this.sendMessage(msg.channel, { level: 'success', title: `Your account has been linked with \`${username}\`` });

                LinkRequest.createQueryBuilder()
                    .where('uuid = :uuid', { uuid })
                    .orWhere('tag = :tag', { tag })
                    .delete();

            }

        } else this.sendMessage(msg.channel, { level: 'error', title: 'There is no link request open for this account' })


    }

    async joined(userId: string, serverId: string) {
        const guild = this.client.guilds.resolve(serverId);
        const user = guild?.members.resolve(userId);
    }

    async left(userId: string, serverId: string) {
        const guild = this.client.guilds.resolve(serverId);
        const user = guild?.members.resolve(userId);
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