import { Column } from "typeorm";

class Timestamps {

    @Column({ default: 'CURRENT_TIMESTAMP' })
    created!: Date;

    @Column({ default: 'CURRENT_TIMESTAMP' })
    updated!: Date;

}

export default Timestamps;