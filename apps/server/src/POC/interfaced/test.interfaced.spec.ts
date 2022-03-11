import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import {} from '@shared/domain';
import { courseFactory, taskBoardElementFactory, cleanupCollections } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { BoardRepoInterfaced } from './board.repo';
import { BoardEntityInterfaced } from './board.entity';
import { BoardDataMapperInterfaced } from './board.datamapper';

describe('POC simple', () => {
	let module: TestingModule;
	let repo: BoardRepoInterfaced;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [BoardRepoInterfaced],
		}).compile();
		repo = module.get(BoardRepoInterfaced);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(BoardDataMapperInterfaced, {});
	});

	it('connects to course', async () => {
		const course = courseFactory.build();
		const taskElements = taskBoardElementFactory.buildList(3, { target: { course } });
		await em.persistAndFlush([...taskElements, course]);
		const data = new BoardDataMapperInterfaced({ course, references: taskElements });
		const board = new BoardEntityInterfaced(data);
		await repo.persistAndFlush(board);

		em.clear();

		const fetchedEntity = await repo.findById(data.id);
		expect(fetchedEntity.data.courseId).toEqual(course.id);

		const newCourse = courseFactory.build();
		await em.persistAndFlush([newCourse]);
		fetchedEntity.data.courseId = newCourse.id;

		await repo.persistAndFlush(fetchedEntity);

		em.clear();

		const resultEntity = await repo.findById(data.id);
		expect(resultEntity.data.courseId).toEqual(newCourse.id);
	});

	it('does stuff', async () => {
		const course = courseFactory.build();
		const taskElements = taskBoardElementFactory.buildList(3, { target: { course } });
		await em.persistAndFlush([...taskElements, course]);
		const data = new BoardDataMapperInterfaced({ course, references: taskElements });
		const board = new BoardEntityInterfaced(data);
		await repo.persistAndFlush(board);

		em.clear();

		const fetchedEntity = await repo.findById(data.id);
		const newOrder = [taskElements[1], taskElements[2], taskElements[0]].map((el) => el.target.id);
		fetchedEntity.reorderElements(newOrder);
		await repo.persistAndFlush(fetchedEntity);

		em.clear();

		const resultEntity = await repo.findById(data.id);
		expect(resultEntity.getElements().map((el) => el.target.id)).toEqual(newOrder);
	});
});
