import { Entity, Property, OneToOne, Unique, Index } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import { System } from './system.entity';
import { User } from './user.entity';

export type IAccountProperties = Readonly<Omit<Account, keyof BaseEntityWithTimestamps>>;

// TODO This is ought to replace feathers account model ('src\services\account\model.js').
@Entity({ tableName: 'accounts' })
export class Account extends BaseEntityWithTimestamps {
	@Property()
	username: string;

	@Property({ nullable: true })
	password?: string;

	@Property({ nullable: true })
	token?: string;

	@Property({ nullable: true })
	credentialHash?: string;

	// TODO set index to true after we removed the account model from feathers
	@OneToOne({ entity: () => User, fieldName: 'userId' })
	user: User;

	@OneToOne({ entity: () => System, fieldName: 'systemId', nullable: true })
	system?: System;

	@Property({ nullable: true })
	lasttriedFailedLogin?: Date;

	@Property({ nullable: true })
	expiresAt?: Date;

	@Property({ nullable: true })
	activated?: boolean;

	constructor(props: IAccountProperties) {
		super();
		this.username = props.username;
		this.password = props.password;
		this.token = props.token;
		this.credentialHash = props.credentialHash;
		this.user = props.user;
		this.system = props.system;
		this.lasttriedFailedLogin = props.lasttriedFailedLogin;
		this.expiresAt = props.expiresAt;
		this.activated = props.activated;
	}
}
