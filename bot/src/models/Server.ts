import { Column, BaseEntity, PrimaryGeneratedColumn, Entity, OneToOne, OneToMany } from "typeorm";
import Timestamps from "./Timestamps";
import jwt from 'jsonwebtoken';
import Config from "./Config";
import ServerLinkRequest from "./ServerLinkRequest";

@Entity()
export default class Server extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    address!: string;

    @Column({ select: false })
    key!: string;

    @Column(() => Timestamps)
    timestamps!: Timestamps;

    @Column({ default: false })
    running!: boolean;

    @Column({ nullable: true })
    discordId?: string;

    @OneToMany(() => ServerLinkRequest, r => r.server)
    request!: Promise<ServerLinkRequest[]>;

}