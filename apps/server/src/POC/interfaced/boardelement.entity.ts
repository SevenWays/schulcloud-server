import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ILearnroomElement } from '@shared/domain/interface';

export interface BoardElementData {
	id: EntityId;
	title: string;
}

export class BoardElement {
	constructor(data: BoardElementData) {
		this.data = data;
	}

	private data: BoardElementData;

	get id() {
		return this.data.id;
	}

	get title() {
		return this.data.title;
	}
}
