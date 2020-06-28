import { Column, Timestamp, BaseEntity } from "typeorm";
import Timestamps from "./Timestamps";
import jwt from 'jsonwebtoken';

class LinkRequest extends BaseEntity {

    @Column()
    username!: string;

    @Column({ unique: true })
    uuid!: string;

    @Column()
    tag!: string;

    verify(key: string) {
        const { JWT_SECRET } = process.env;
        if (!JWT_SECRET) throw new Error('No JWT Secret defined, contact admin');

        const { uuid, tag } = jwt.verify(key, JWT_SECRET) as any;
        return uuid === this.uuid && tag === this.tag;
    }

    createKey() {
        const { JWT_SECRET } = process.env;
        if (!JWT_SECRET) throw new Error('No JWT Secret defined, contact admin');

        const { uuid, tag } = this;
        return jwt.sign({ uuid, tag }, JWT_SECRET);
    }

    @Column(() => Timestamp)
    timestamps!: Timestamps;

}

export default LinkRequest;