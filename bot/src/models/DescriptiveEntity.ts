import { BaseEntity } from "typeorm"
import { ok } from "assert";

const DESCRIPTION = Symbol('description');

export function Description(text: string) {
    return Reflect.metadata(DESCRIPTION, text)
}

export default class DescriptiveEntity extends BaseEntity {

    getDescription(key: string): string | undefined {
        return Reflect.getMetadata(DESCRIPTION, this, key)
    }

    descriptions(): string[] {
        return Object.keys(this).filter(key => this.getDescription(key)) as string[];
    }

}