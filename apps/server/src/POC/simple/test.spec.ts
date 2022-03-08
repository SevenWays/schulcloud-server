import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import {} from '@shared/domain';
import { courseFactory, taskBoardElementFactory, cleanupCollections } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { BoardRepoSimple } from './board.repo';
import { BoardEntitySimple } from './board.entity';
import { BoardDataMapperSimple } from './board.datamapper';

describe('POC simple', () => {
	let module: TestingModule;
	let repo: BoardRepoSimple;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [BoardRepoSimple],
		}).compile();
		repo = module.get(BoardRepoSimple);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(BoardDataMapperSimple, {});
	});

	it('does stuff', async () => {
		const course = courseFactory.build();
		const taskElements = taskBoardElementFactory.buildList(3, { target: { course } });
		await em.persistAndFlush([...taskElements, course]);
		const data = new BoardDataMapperSimple({ course, references: taskElements });
		const board = new BoardEntitySimple(data);
		await repo.persistAndFlush(board);

		em.clear();

		const fetchedEntity = await repo.findById(data.id);
		fetchedEntity.reorderElements([taskElements[1].id, taskElements[2].id, taskElements[0].id]);
		await repo.persistAndFlush(fetchedEntity);

		em.clear();

		const resultEntity = await repo.findById(data.id);
		expect(resultEntity.getElements()).toEqual([taskElements[1], taskElements[2], taskElements[0]]);
	});
});
