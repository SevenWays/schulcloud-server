import { Entity, MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import { ObjectId } from 'mongodb';
import { BaseEntity } from './base.entity';

@Entity()
class User extends BaseEntity {}

describe('BaseEntity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities([User]);
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('when _id property is set to ObjectId', () => {
		it('should serialize the ObjectId to the id property', () => {
			const user = new User();
			user._id = new ObjectId();
			expect(user.id).toEqual(user._id.toHexString());
		});
	});

	describe('when id property is set to serialized ObjectId', () => {
		it('should wrap the serialized id to the _id property', () => {
			const user = new User();
			user.id = new ObjectId().toHexString();
			expect(user._id).toBeInstanceOf(ObjectId);
			expect(user._id.toHexString()).toEqual(user.id);
		});
	});
});
