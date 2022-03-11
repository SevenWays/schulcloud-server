import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { SchoolData } from './school.entity';

export type SchoolProps = {
	name: string;
};

@Entity({ tableName: 'schoolpoc' })
export class SchoolDataMapperPOC extends BaseEntityWithTimestamps implements SchoolData {
	constructor(props: SchoolProps) {
		super();
		this.name = props.name;
	}

	@Property()
	name: string;
}
