import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { schoolClassFactory } from '../testfactories/schoolclass.factory';
import { SchoolClassRepoPOC } from './schoolclass.repo';
import { schoolFactory } from '../testfactories/school.factory';
import { personFactory } from '../testfactories/person.factory';

describe('POC school class', () => {
	let module: TestingModule;
	let repo: SchoolClassRepoPOC;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SchoolClassRepoPOC],
		}).compile();
		repo = module.get(SchoolClassRepoPOC);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('change grade of class', async () => {
		const klass = schoolClassFactory.build({ grade: 5, suffix: 'd' });
		await em.persistAndFlush([klass]);
		em.clear();

		const loadedClass = await repo.findById(klass.id);
		expect(loadedClass.name).toEqual('5d');

		loadedClass.grade = 6;

		await repo.persistAndFlush(loadedClass);
		em.clear();

		const classLater = await repo.findById(klass.id);
		expect(classLater.name).toEqual('6d');
	});

	it('load school via repo', async () => {
		const schoolData = schoolFactory.buildWithId();
		const classData = schoolClassFactory.build({ grade: 5, suffix: 'd', schoolId: schoolData.id });
		await em.persistAndFlush([classData, schoolData]);
		em.clear();

		const loadedClass = await repo.findById(classData.id);
		expect(loadedClass.schoolId).toEqual(classData.schoolRef.id);

		const school = await repo.getSchoolForClass(loadedClass); // maybe school repo?
		expect(school.name).toEqual(schoolData.name);
	});

	it('load school via entity', async () => {
		const schoolData = schoolFactory.buildWithId();
		const classData = schoolClassFactory.build({ grade: 5, suffix: 'd', schoolId: schoolData.id });
		await em.persistAndFlush([classData, schoolData]);
		em.clear();

		const loadedClass = await repo.findById(classData.id);
		expect(loadedClass.schoolId).toEqual(classData.schoolRef.id);

		const school = await loadedClass.fetchSchool();
		expect(school.name).toEqual(schoolData.name);
	});

	it('should adjust students of class', async () => {
		const schoolData = schoolFactory.build();
		const studentDatas = personFactory.buildList(3);
		await em.persistAndFlush([schoolData, ...studentDatas]);
		const classData = schoolClassFactory.build({
			grade: 5,
			suffix: 'd',
			schoolId: schoolData.id,
			students: studentDatas,
		});
		await em.persistAndFlush([classData]);
		em.clear();
	});
});
