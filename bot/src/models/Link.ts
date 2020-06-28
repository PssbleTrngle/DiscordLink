import { Column, Timestamp, BaseEntity } from "typeorm";
import Timestamps from "./Timestamps";
import jwt from 'jsonwebtoken';

class LinkRequest extends BaseEntity {

    @Column({ unique: true })
    uuid!: string;

    @Column({ unique: true })
    tag!: string;

    @Column(() => Timestamp)
    timestamps!: Timestamps;

}

export default LinkRequest;