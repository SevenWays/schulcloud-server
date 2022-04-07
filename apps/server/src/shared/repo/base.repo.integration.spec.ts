import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Entity, EntityName, Property } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from './base.repo';

describe('BaseRepo', () => {
	@Entity()
	class TestEntity extends BaseEntity {
		@Property()
		name = 'test';
	}

	@Injectable()
	class TestRepo extends BaseRepo<TestEntity> {
		get entityName(): EntityName<TestEntity> {
			return TestEntity;
		}
	}

	let repo: TestRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [TestEntity],
				}),
			],
			providers: [TestRepo],
		}).compile();

		repo = module.get(TestRepo);
		em = module.get(EntityManager);
	});

	beforeEach(async () => {
		await em.nativeDelete(TestEntity, {});
		em.clear();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});

		it('repo should implement entityName getter', () => {
			expect(repo.entityName).toBe(TestEntity);
		});
	});

	describe('save', () => {
		it('should persist and flush entities', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();

			await repo.save([testEntity1, testEntity2]);
			em.clear();

			const result = await em.find(TestEntity, {});
			expect(result).toHaveLength(2);
			expect(result).toStrictEqual([testEntity1, testEntity2]);
		});
	});

	describe('delete', () => {
		it('should remove and flush entities', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);
			em.clear();

			await repo.delete([testEntity1, testEntity2]);
			em.clear();

			await expect(async () => {
				await em.findOneOrFail(TestEntity, testEntity1.id);
			}).rejects.toThrow(`TestEntity not found ('${testEntity1.id}')`);
			await expect(async () => {
				await em.findOneOrFail(TestEntity, testEntity2.id);
			}).rejects.toThrow(`TestEntity not found ('${testEntity2.id}')`);
		});
	});

	describe('findById', () => {
		it('should find entity', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);
			em.clear();

			const result = await repo.findById(testEntity1.id);

			expect(result).toEqual(testEntity1);
		});

		it('should throw if entity not found', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);
			em.clear();

			const unknownId = new ObjectId().toHexString();

			await expect(async () => {
				await repo.findById(unknownId);
			}).rejects.toThrow(`TestEntity not found ('${unknownId}')`);
		});
	});
});
