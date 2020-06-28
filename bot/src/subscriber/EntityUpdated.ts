import { EntitySubscriberInterface, EventSubscriber, UpdateEvent, InsertEvent, BaseEntity } from "typeorm";
import { debug } from "../logging";
import Timestamps from "../models/Timestamps";

export interface IEntity extends BaseEntity {
    timestamps?: Timestamps;
}
export type EntityStatic<E extends IEntity> = { new(): E } & typeof BaseEntity;

@EventSubscriber()
export class EntityUpdated implements EntitySubscriberInterface<any> {

    beforeUpdate(event: UpdateEvent<IEntity>) {
        if (event.entity.timestamps) {
            event.entity.timestamps.updated = new Date();
        }
    }

    /*
    beforeInsert(event: InsertEvent<any>) {
        const date = event.entity.timestamps?.created ?? new Date().getTime();
        event.entity.timestamps = {
            created: date,
            updated: date,
        }
    }
    */

}
