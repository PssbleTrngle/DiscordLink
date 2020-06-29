import { Column, BaseEntity, PrimaryGeneratedColumn, Entity } from "typeorm";
import Timestamps from "./Timestamps";
import jwt from 'jsonwebtoken';

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

}