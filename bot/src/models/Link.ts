import { Column, Timestamp, BaseEntity, PrimaryGeneratedColumn, Entity } from "typeorm";
import Timestamps from "./Timestamps";
import jwt from 'jsonwebtoken';

@Entity()
export default class LinkRequest extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    uuid!: string;

    @Column({ unique: true })
    discordId!: string;

    @Column(() => Timestamps)
    timestamps!: Timestamps;

}