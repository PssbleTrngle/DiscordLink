import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Server from "./Server";
import Timestamps from "./Timestamps";

@Entity()
@Index('link_request_per_discord_per_server', r => [r.discordId, r.server], { unique: true })
export default class ServerLinkRequest extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    ownerId!: string;

    @Column()
    discordId!: string;

    @ManyToOne(() => Server, s => s.request, { eager: true })
    server!: Server;

    @Column(() => Timestamps)
    timestamps!: Timestamps;

}