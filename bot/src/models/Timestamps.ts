import { Column } from "typeorm";

export default class Timestamps {

    @Column({ default: 'CURRENT_TIMESTAMP' })
    created!: Date;

    @Column({ default: 'CURRENT_TIMESTAMP' })
    updated!: Date;

}