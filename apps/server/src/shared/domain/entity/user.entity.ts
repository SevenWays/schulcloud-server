import { Collection, Entity, ManyToMany, ManyToOne, Property, Index } from '@mikro-orm/core';
import type { Role } from './role.entity';
import type { School } from './school.entity';
import { BaseEntityWithTimestamps } from './base.entity';

export interface IUserProperties {
	email: string;
	firstName: string;
	lastName: string;
	school: School;
	roles: Role[];
	ldapId?: string;
	forcePasswordChange?: boolean;
	preferences?: Record<string, unknown>;
}

@Entity({ tableName: 'users' })
export class User extends BaseEntityWithTimestamps {
	@Property()
	@Index({ name: 'externalUserIdentifier', options: { unique: true } })
	email: string;

	@Property()
	firstName: string;

	@Property()
	lastName: string;

	@Index({ name: 'roleIdBasedSearches' })
	@ManyToMany('Role', undefined, { fieldName: 'roles' })
	roles = new Collection<Role>(this);

	@Index({ name: 'searchUserForSchool' })
	@ManyToOne('School', { fieldName: 'schoolId' })
	school!: School;

	@Property()
	ldapId?: string;

	@Property()
	forcePasswordChange?: boolean;

	@Property()
	preferences?: Record<string, unknown>;

	constructor(props: IUserProperties) {
		super();
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.email = props.email;
		this.school = props.school;
		this.roles.set(props.roles);
		this.ldapId = props.ldapId;
		this.forcePasswordChange = props.forcePasswordChange;
		this.preferences = props.preferences ?? {};
	}
}
