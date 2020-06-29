import axios from 'axios';

const request = axios.create({
    baseURL: 'https://api.mojang.com/'
})

type History = Array<{
    name: string,
    changedToAt?: number;
}>

export default {

    async getUsername(uuid: string) {
        const history = await request.get<History>(`user/profiles/${uuid}/names`);
        return history.data[0];
    }

}