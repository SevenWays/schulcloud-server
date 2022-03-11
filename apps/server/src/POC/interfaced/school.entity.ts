import { EntityId } from '@shared/domain/types';

export interface SchoolData {
	id: EntityId;
	name: string;
}

export class School {
	constructor(data: SchoolData) {
		this.data = data;
	}

	private data: SchoolData;

	get id() {
		return this.data.id;
	}

	get name() {
		return this.data.name;
	}
}
