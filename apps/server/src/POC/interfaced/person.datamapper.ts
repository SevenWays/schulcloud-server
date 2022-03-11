import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { Person, PersonData } from './person.entity';

export type PersonProps = {
	name: string;
};

@Entity({ tableName: 'personpoc' })
export class PersonDatamapper extends BaseEntityWithTimestamps implements PersonData {
	constructor(props: PersonProps) {
		super();
		this.name = props.name;

		this.entity = new Person(this);
	}

	@Property()
	name: string;

	entity: Person;
}
