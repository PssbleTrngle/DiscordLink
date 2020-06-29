import { Column, BaseEntity, PrimaryGeneratedColumn, Entity, OneToOne } from "typeorm";
import Timestamps from "./Timestamps";
import jwt from 'jsonwebtoken';
import Server from "./Server";
import { Base } from "discord.js";
import DescriptiveEntity, { Description } from "./DescriptiveEntity";

const DEFAULT_PREFIX = process.env.DEFAULT_PREFIX ?? '~'

@Entity()
export default class Config extends DescriptiveEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    serverId!: string;

    @Column({ default: DEFAULT_PREFIX })
    @Description('The command prefix')
    prefix!: string;

    @Column({ nullable: true })
    @Description('A role every user joined the server gets')
    joinedRole!: string;

    @Column({ nullable: true })
    @Description('A role every user that is online on the server gets')
    onlineRole!: string;

}