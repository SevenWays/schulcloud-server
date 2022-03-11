import { EntityId } from '@shared/domain/types';

export interface PersonData {
	id: EntityId;
	name: string;
}

export class Person {
	constructor(data: PersonData) {
		this.data = data;
	}

	data: PersonData;

	get id() {
		return this.data.id;
	}

	get name() {
		return this.data.name;
	}
}
