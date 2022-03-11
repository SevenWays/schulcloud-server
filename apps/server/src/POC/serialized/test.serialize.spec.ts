import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import {} from '@shared/domain';
import { courseFactory, taskBoardElementFactory, cleanupCollections } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { BoardRepoSerialize } from './board.repo';
import { BoardEntitySerialize } from './board.entity';
import { BoardDataMapperSerialize } from './board.datamapper';

describe('POC serialize', () => {
	let module: TestingModule;
	let repo: BoardRepoSerialize;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [BoardRepoSerialize],
		}).compile();
		repo = module.get(BoardRepoSerialize);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(BoardDataMapperSerialize, {});
	});

	it('does stuff', async () => {
		const course = courseFactory.build();
		const taskElements = taskBoardElementFactory.buildList(3, { target: { course } });
		await em.persistAndFlush([...taskElements, course]);
		const data = new BoardDataMapperSerialize({ course, references: taskElements });
		const board = new BoardEntitySerialize(data);
		await repo.persistAndFlush(board);

		em.clear();

		const fetchedEntity = await repo.findById(data.id);

		const dto = fetchedEntity.data.toObject();

		expect(dto.references[0].target.name).toEqual(taskElements[0].target.name);
		expect(dto.course).toEqual(course.id);

		const newOrder = [taskElements[1], taskElements[2], taskElements[0]].map((el) => el.target.id);
		fetchedEntity.reorderElements(newOrder);
		await repo.persistAndFlush(fetchedEntity);

		em.clear();

		const resultEntity = await repo.findById(data.id);
		expect(resultEntity.getElements().map((el) => el.target.id)).toEqual(newOrder);
	});
});
