import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { EntityId, TaskBoardElement, LessonBoardElement } from '@shared/domain';
import { BoardDataMapperSimple } from './board.datamapper';
import { BoardEntitySimple } from './board.entity';

@Injectable()
export class BoardRepoSimple {
	constructor(private readonly em: EntityManager) {}

	async findByCourseId(courseId: EntityId): Promise<BoardEntitySimple> {
		const board = await this.em.findOneOrFail(BoardDataMapperSimple, { course: courseId });
		await this.populateBoard(board);
		const entity = new BoardEntitySimple(board);
		return entity;
	}

	async findById(id: EntityId): Promise<BoardEntitySimple> {
		const board = await this.em.findOneOrFail(BoardDataMapperSimple, { id });
		await this.populateBoard(board);
		const entity = new BoardEntitySimple(board);
		return entity;
	}

	private async populateBoard(board: BoardDataMapperSimple) {
		await board.references.init();
		const elements = board.references.getItems();
		const discriminatorColumn = 'target';
		const taskElements = elements.filter((el) => el instanceof TaskBoardElement);
		await this.em.populate(taskElements, [discriminatorColumn]);
		const lessonElements = elements.filter((el) => el instanceof LessonBoardElement);
		await this.em.populate(lessonElements, [discriminatorColumn]);
		return board;
	}

	async persistAndFlush(board: BoardEntitySimple): Promise<void> {
		await this.em.persistAndFlush(board.data);
		return Promise.resolve();
	}
}
