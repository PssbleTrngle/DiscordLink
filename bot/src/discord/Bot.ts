import discord, { Client, Message } from 'discord.js';
import LinkRequest from '../models/LinkRequest';
import Link from '../models/Link';
import jwt from 'jsonwebtoken';

class DiscordBot {

    private client = new Client();

    constructor(private token: string) {

        this.client.on('message', msg => {
            if(msg.author.bot) return;

            if (msg.channel.type === 'dm') this.handleDM(msg);

        })

    }

    async handleDM(msg: Message) {

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

            } else msg.channel.send('Invalid key');

        } else msg.channel.send('There is no link request open for this account')


    }

    async fetchDiscordUser(id: string) {
        return this.client.users.fetch(id, true);
    }

    async run() {
        await this.client.login(this.token)
    }

}

export default DiscordBot;