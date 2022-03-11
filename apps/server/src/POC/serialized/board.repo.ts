import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { EntityId, TaskBoardElement, LessonBoardElement } from '@shared/domain';
import { BoardDataMapperSerialize } from './board.datamapper';
import { BoardEntitySerialize } from './board.entity';

@Injectable()
export class BoardRepoSerialize {
	constructor(private readonly em: EntityManager) {}

	async findByCourseId(courseId: EntityId): Promise<BoardEntitySerialize> {
		const board = await this.em.findOneOrFail(BoardDataMapperSerialize, { course: courseId });
		await this.populateBoard(board);
		const entity = new BoardEntitySerialize(board);
		return entity;
	}

	async findById(id: EntityId): Promise<BoardEntitySerialize> {
		const board = await this.em.findOneOrFail(BoardDataMapperSerialize, { id });
		await this.populateBoard(board);
		const entity = new BoardEntitySerialize(board);
		return entity;
	}

	private async populateBoard(board: BoardDataMapperSerialize) {
		await board.references.init();
		const elements = board.references.getItems();
		const discriminatorColumn = 'target';
		const taskElements = elements.filter((el) => el instanceof TaskBoardElement);
		await this.em.populate(taskElements, [discriminatorColumn]);
		const lessonElements = elements.filter((el) => el instanceof LessonBoardElement);
		await this.em.populate(lessonElements, [discriminatorColumn]);
		return board;
	}

	async persistAndFlush(board: BoardEntitySerialize): Promise<void> {
		await this.em.persistAndFlush(board.data);
		return Promise.resolve();
	}
}
