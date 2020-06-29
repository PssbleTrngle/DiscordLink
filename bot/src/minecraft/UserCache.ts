import axios from 'axios';

const request = axios.create({
    baseURL: 'https://api.mojang.com/',
})

type History = Array<{
    name: string,
    changedToAt?: number;
}>

export default {

    async getUsername(uuid: string) {
        const smallUUID = uuid.split('-').join('');
        const { data } = await request.get<History>(`user/profiles/${smallUUID}/names`);
        const last = data[data.length - 1];
        return last?.name;
    }

}