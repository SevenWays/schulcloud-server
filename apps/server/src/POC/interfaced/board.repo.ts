import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { EntityId, TaskBoardElement, LessonBoardElement } from '@shared/domain';
import { BoardDataMapperPOC } from './board.datamapper';
import { BoardEntityPOC } from './board.entity';

@Injectable()
export class BoardRepoPOC {
	constructor(private readonly em: EntityManager) {}

	async findByCourseId(courseId: EntityId): Promise<BoardEntityPOC> {
		const board = await this.em.findOneOrFail(BoardDataMapperPOC, { courseRef: courseId });
		await this.populateBoard(board);
		const entity = new BoardEntityPOC(board);
		return entity;
	}

	async findById(id: EntityId): Promise<BoardEntityPOC> {
		const board = await this.em.findOneOrFail(BoardDataMapperPOC, { id });
		await this.populateBoard(board);
		const entity = new BoardEntityPOC(board);
		return entity;
	}

	private async populateBoard(board: BoardDataMapperPOC) {
		await board.elementRef.init();
		const elements = board.elementRef.getItems();
		const discriminatorColumn = 'target';
		const taskElements = elements.filter((el) => el instanceof TaskBoardElement);
		await this.em.populate(taskElements, [discriminatorColumn]);
		const lessonElements = elements.filter((el) => el instanceof LessonBoardElement);
		await this.em.populate(lessonElements, [discriminatorColumn]);
		return board;
	}

	async persistAndFlush(board: BoardEntityPOC): Promise<void> {
		// TODO: be able to pass Datamapper
		await this.em.persistAndFlush(board.data as BoardDataMapperPOC);
		return Promise.resolve();
	}
}
