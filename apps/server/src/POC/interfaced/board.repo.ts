import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { EntityId, TaskBoardElement, LessonBoardElement } from '@shared/domain';
import { BoardDataMapperInterfaced } from './board.datamapper';
import { BoardEntityInterfaced } from './board.entity';

@Injectable()
export class BoardRepoInterfaced {
	constructor(private readonly em: EntityManager) {}

	async findByCourseId(courseId: EntityId): Promise<BoardEntityInterfaced> {
		const board = await this.em.findOneOrFail(BoardDataMapperInterfaced, { courseRef: courseId });
		await this.populateBoard(board);
		const entity = new BoardEntityInterfaced(board);
		return entity;
	}

	async findById(id: EntityId): Promise<BoardEntityInterfaced> {
		const board = await this.em.findOneOrFail(BoardDataMapperInterfaced, { id });
		await this.populateBoard(board);
		const entity = new BoardEntityInterfaced(board);
		return entity;
	}

	private async populateBoard(board: BoardDataMapperInterfaced) {
		await board.references.init();
		const elements = board.references.getItems();
		const discriminatorColumn = 'target';
		const taskElements = elements.filter((el) => el instanceof TaskBoardElement);
		await this.em.populate(taskElements, [discriminatorColumn]);
		const lessonElements = elements.filter((el) => el instanceof LessonBoardElement);
		await this.em.populate(lessonElements, [discriminatorColumn]);
		return board;
	}

	async persistAndFlush(board: BoardEntityInterfaced): Promise<void> {
		// TODO: be able to pass Datamapper
		await this.em.persistAndFlush(board.data as BoardDataMapperInterfaced);
		return Promise.resolve();
	}
}
