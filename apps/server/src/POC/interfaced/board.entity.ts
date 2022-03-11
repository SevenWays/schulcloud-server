import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityId, ILearnroomElement, BoardElement } from '@shared/domain';
import { BoardData } from './board.datamapper';

export class BoardEntityPOC {
	constructor(data: BoardData) {
		this.data = data;
	}

	data: BoardData;

	getByTargetId(id: EntityId): ILearnroomElement {
		const element = this.getElementByTargetId(id);
		return element.target;
	}

	getElements() {
		return this.data.elements;
	}

	reorderElements(ids: EntityId[]) {
		this.validateReordering(ids);

		const elements = ids.map((id) => this.getElementByTargetId(id));

		this.data.elements = elements;
	}

	private validateReordering(reorderedIds: EntityId[]) {
		const existingElements = this.getElements().map((el) => el.target.id);
		const listsEqual = this.checkListsContainingEqualEntities(reorderedIds, existingElements);
		if (!listsEqual) {
			throw new BadRequestException('elements did not match. please fetch the elements of the board before reordering');
		}
	}

	private checkListsContainingEqualEntities(first: EntityId[], second: EntityId[]): boolean {
		const firstSorted = [...first].sort();
		const secondSorted = [...second].sort();
		const isEqual = JSON.stringify(firstSorted) === JSON.stringify(secondSorted);
		return isEqual;
	}

	private getElementByTargetId(id: EntityId): BoardElement {
		const element = this.getElements().find((el) => el.target.id === id);
		if (!element) throw new NotFoundException('board does not contain such element');
		return element;
	}
}
