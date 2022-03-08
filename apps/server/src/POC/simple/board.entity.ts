import { Entity, Collection, ManyToMany, OneToOne, IdentifiedReference, wrap } from '@mikro-orm/core';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Task, Lesson, EntityId, ILearnroomElement, BoardElement, BoardElementType } from '@shared/domain';
import { BoardDataMapperSimple } from './board.datamapper';

@Entity({ tableName: 'board' })
export class BoardEntitySimple {
	constructor(data: BoardDataMapperSimple) {
		this.data = data;
	}

	data: BoardDataMapperSimple;

	getByTargetId(id: EntityId): ILearnroomElement {
		const element = this.getElementByTargetId(id);
		return element.target;
	}

	getElements() {
		return this.data.references.getItems();
	}

	reorderElements(ids: EntityId[]) {
		this.validateReordering(ids);

		const elements = ids.map((id) => this.getElementByTargetId(id));

		this.data.references.set(elements);
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

	syncTasksFromList(taskList: Task[]) {
		// should this be in an external domain service, to not having to know about tasks?
		this.removeTasksNotInList(taskList);
		this.addTasksOnList(taskList);
	}

	syncLessonsFromList(lessonList: Lesson[]) {
		this.removeLessonsNotInList(lessonList);
		this.addLessonsOnList(lessonList);
	}

	private removeTasksNotInList(taskList: Task[]) {
		const taskReferences = this.data.references
			.getItems()
			.filter((ref) => ref.boardElementType === BoardElementType.Task);
		taskReferences.forEach((reference) => {
			// TODO: use typescript guard
			if (!taskList.includes(reference.target as Task)) {
				this.data.references.remove(reference);
			}
		});
	}

	private removeLessonsNotInList(lessonList: Lesson[]) {
		const lessonReferences = this.data.references
			.getItems()
			.filter((ref) => ref.boardElementType === BoardElementType.Lesson);
		lessonReferences.forEach((reference) => {
			// TODO: use typescript guard
			if (!lessonList.includes(reference.target as Lesson)) {
				this.data.references.remove(reference);
			}
		});
	}

	private addTasksOnList(taskList: Task[]) {
		taskList.forEach((task) => {
			const alreadyContained = this.data.references
				.getItems()
				.find((ref) => ref.boardElementType === BoardElementType.Task && ref.target === task);
			if (!alreadyContained) {
				this.data.references.add(BoardElement.FromTask(task));
			}
		});
	}

	private addLessonsOnList(lessonList: Lesson[]) {
		lessonList.forEach((lesson) => {
			const alreadyContained = this.data.references
				.getItems()
				.find((ref) => ref.boardElementType === BoardElementType.Lesson && ref.target === lesson);
			if (!alreadyContained) {
				this.data.references.add(BoardElement.FromLesson(lesson));
			}
		});
	}
}
