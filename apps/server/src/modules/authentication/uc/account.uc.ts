import { EntityNotFoundError, InvalidOperationError, ValidationError } from '@shared/common/error';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Account, EntityId, ICurrentUser, PermissionService, RoleName, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { AccountRepo } from '@shared/repo/account';
import bcrypt from 'bcryptjs';
import { InvalidArgumentError } from '@shared/common/error/invalid-argument.error';
import { wrap } from '@mikro-orm/core';
import { UnauthorizedError } from '@shared/common/error/unauthorized.error';
import {
	AccountByIdBody,
	AccountByIdParams,
	AccountByIdResponse,
	AccountSearchListResponse,
	AccountSearchType,
	AccountSearchQuery,
	AccountSearchResponse,
	PatchMyAccountParams,
} from '../controller/dto';

type UserPreferences = {
	// first login completed
	firstLogin: boolean;
};

@Injectable()
export class AccountUc {
	constructor(
		private readonly accountRepo: AccountRepo,
		private readonly userRepo: UserRepo,
		private readonly permissionService: PermissionService
	) {}

	async searchAccounts(currentUser: ICurrentUser, query: AccountSearchQuery): Promise<AccountSearchListResponse> {
		const skip = query.skip ?? 0;
		const limit = query.limit ?? 10;

		if (skip < 0) {
			throw new InvalidArgumentError('Skip is less than 0.');
		}
		if (limit < 1) {
			throw new InvalidArgumentError('Limit is less than 1.');
		}
		if (limit > 100) {
			throw new InvalidArgumentError('Limit is greater than 100.');
		}
		if (!(await this.isSuperhero(currentUser))) {
			throw new UnauthorizedError('Current user is not authorized to search for accounts.');
		}

		switch (query.type) {
			case AccountSearchType.USER_ID:
				// eslint-disable-next-line no-case-declarations
				const account = await this.accountRepo.findByUserId(query.value);
				return new AccountSearchListResponse([new AccountSearchResponse(account)], 1, 0, 1);
			case AccountSearchType.USERNAME:
				// eslint-disable-next-line no-case-declarations
				const accounts = await this.accountRepo.searchByUsername(query.value);
				// eslint-disable-next-line no-case-declarations
				const accountList = accounts
					.map((tempAccount) => new AccountSearchResponse(tempAccount))
					.sort((a, b) => (a.username > b.username ? 1 : -1))
					.slice(skip, skip + limit);
				return new AccountSearchListResponse(accountList, accounts.length, skip, limit);
			default:
				throw new InvalidArgumentError('Invalid search type.');
		}
	}

	async findAccountById(currentUser: ICurrentUser, params: AccountByIdParams): Promise<AccountByIdResponse> {
		if (!(await this.isSuperhero(currentUser))) {
			throw new UnauthorizedError('Current user is not authorized to search for accounts.');
		}
		const account = await this.accountRepo.findById(params.id);
		return new AccountByIdResponse(account);
	}

	async updateAccountById(
		currentUser: ICurrentUser,
		params: AccountByIdParams,
		body: AccountByIdBody
	): Promise<AccountByIdResponse> {
		if (!(await this.isSuperhero(currentUser))) {
			throw new UnauthorizedError('Current user is not authorized to update an account.');
		}

		const account = await this.accountRepo.findById(params.id);
		const user = await this.userRepo.findById(account.user.id);
		body.password = await this.calcPasswordHash(body.password);
		user.forcePasswordChange = true;
		wrap(account).assign(body);
		await this.accountRepo.update(account);
		await this.userRepo.update(user);
		return new AccountByIdResponse(account);
	}

	async deleteAccountById(currentUser: ICurrentUser, params: AccountByIdParams): Promise<AccountByIdResponse> {
		if (!(await this.isSuperhero(currentUser))) {
			throw new UnauthorizedError('Current user is not authorized to delete an account.');
		}
		const account = await this.accountRepo.delete(params.id);
		return new AccountByIdResponse(account);
	}

	async updateMyAccount(currentUser: EntityId, params: PatchMyAccountParams) {
		let account: Account;
		try {
			account = await this.accountRepo.findByUserId(currentUser);
		} catch (err) {
			throw new EntityNotFoundError('Account');
		}

		if (account.system) {
			throw new InvalidOperationError('External account details can not be changed.');
		}

		if (!params.passwordOld || !account.password || !(await this.checkPassword(params.passwordOld, account.password))) {
			throw new Error('Dein Passwort ist nicht korrekt!');
		}

		let user: User;
		try {
			user = await this.userRepo.findById(currentUser, true);
		} catch (err) {
			throw new EntityNotFoundError('User');
		}

		let updateUser = false;
		let updateAccount = false;
		if (params.passwordNew) {
			account.password = await this.calcPasswordHash(params.passwordNew);
			updateAccount = true;
		}
		// TODO Check with BC-1471 - This might be removed from the account page
		if (params.language && user.language !== params.language) {
			// TODO Check if there is an enum or some other fixed values here?
			user.language = params.language;
			updateUser = true;
		}
		if (params.email && user.email !== params.email) {
			const newMail = params.email.toLowerCase();
			await this.checkUniqueEmail(account, user, newMail);
			user.email = newMail;
			account.username = newMail;
			updateUser = true;
			updateAccount = true;
		}

		if (params.firstName && user.firstName !== params.firstName) {
			if (!this.hasPermissionsToChangeOwnName(user)) {
				throw new InvalidOperationError('No permission to change first name');
			}
			user.firstName = params.firstName;
			updateUser = true;
		}
		if (params.lastName && user.lastName !== params.lastName) {
			if (!this.hasPermissionsToChangeOwnName(user)) {
				throw new InvalidOperationError('No permission to change last name');
			}
			user.lastName = params.lastName;
			updateUser = true;
		}

		if (updateUser) {
			try {
				await this.userRepo.update(user);
			} catch (err) {
				throw new EntityNotFoundError(User.name);
			}
		}
		if (updateAccount) {
			try {
				await this.accountRepo.update(account);
			} catch (err) {
				throw new EntityNotFoundError(Account.name);
			}
		}
	}

	async changeMyTemporaryPassword(userId: EntityId, password: string, confirmPassword: string): Promise<void> {
		if (password !== confirmPassword) {
			throw new InvalidOperationError('Password and confirm password do not match.');
		}

		let user: User;
		try {
			user = await this.userRepo.findById(userId);
		} catch (err) {
			throw new EntityNotFoundError(User.name);
		}
		const userPreferences = <UserPreferences>user.preferences;

		if (!user.forcePasswordChange && userPreferences.firstLogin) {
			throw new InvalidOperationError('The password is not temporary, hence can not be changed.');
		} // Password change was forces or this is a first logon for the user

		let targetAccount: Account;
		try {
			targetAccount = await this.accountRepo.findByUserId(userId);
		} catch (err) {
			throw new EntityNotFoundError(Account.name);
		}

		if (targetAccount.system) {
			throw new InvalidOperationError('External account details can not be changed.');
		}

		if (targetAccount.password === undefined || (await this.checkPassword(password, targetAccount.password))) {
			throw new InvalidOperationError('New password can not be same as old password.');
		}

		try {
			targetAccount.password = await this.calcPasswordHash(password);
			await this.accountRepo.update(targetAccount);
		} catch (err) {
			throw new EntityNotFoundError(Account.name);
		}
		try {
			user.forcePasswordChange = false;
			await this.userRepo.update(user);
		} catch (err) {
			throw new EntityNotFoundError(User.name);
		}
	}

	async changePasswordForUser(currentUserId: EntityId, targetUserId: EntityId, passwordNew: string): Promise<void> {
		// load user data
		let targetAccount: Account;
		let currentUser: User;
		let targetUser: User;
		try {
			targetAccount = await this.accountRepo.findByUserId(targetUserId);
		} catch (err) {
			throw new EntityNotFoundError('Account');
		}
		try {
			currentUser = await this.userRepo.findById(currentUserId, true);
			targetUser = await this.userRepo.findById(targetUserId, true);
		} catch (err) {
			throw new EntityNotFoundError('User');
		}

		// check permission
		if (!this.hasPermissionsToChangePassword(currentUser, targetUser)) {
			throw new ForbiddenException("No permission to change this user's password");
		}

		// set user must change password on next login
		try {
			targetUser.forcePasswordChange = true;
			targetUser = await this.userRepo.update(targetUser);
		} catch (err) {
			throw new EntityNotFoundError('User');
		}
		try {
			targetAccount.password = await this.calcPasswordHash(passwordNew);
			await this.accountRepo.update(targetAccount);
		} catch (err) {
			throw new EntityNotFoundError('Account');
		}
	}

	private hasRole(user: User, roleName: string) {
		return user.roles.getItems().some((role) => {
			return role.name === roleName;
		});
	}

	private async isSuperhero(currentUser: ICurrentUser): Promise<boolean> {
		const user = await this.userRepo.findById(currentUser.userId, true);
		return user.roles.getItems().some((role) => role.name === RoleName.SUPERHERO);
	}

	private isDemoUser(currentUser: User) {
		return this.hasRole(currentUser, 'demoStudent') || this.hasRole(currentUser, 'demoTeacher');
	}

	private hasPermissionsToChangeOwnName(currentUser: User) {
		return (
			this.hasRole(currentUser, 'superhero') ||
			this.hasRole(currentUser, 'teacher') ||
			this.hasRole(currentUser, 'administrator')
		);
	}

	private hasPermissionsToChangePassword(currentUser: User, targetUser: User) {
		if (this.hasRole(currentUser, 'superhero')) {
			return true;
		}
		if (!(currentUser.school.id === targetUser.school.id)) {
			return false;
		}
		if (this.isDemoUser(currentUser)) {
			return false;
		}

		const permissionsToCheck: string[] = [];
		if (this.hasRole(targetUser, 'student')) {
			permissionsToCheck.push('STUDENT_EDIT');
		}
		if (this.hasRole(targetUser, 'teacher')) {
			permissionsToCheck.push('TEACHER_EDIT');
		}
		if (permissionsToCheck.length === 0) {
			// target user is neither student nor teacher. Undefined what to do
			return false;
		}

		return this.permissionService.hasUserAllSchoolPermissions(currentUser, permissionsToCheck);
	}

	private calcPasswordHash(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}

	private async checkPassword(enteredPassword: string, hashedAccountPassword: string) {
		return bcrypt.compare(enteredPassword, hashedAccountPassword);
	}

	private async checkUniqueEmail(account: Account, user: User, email: string): Promise<void> {
		const foundUsers = await this.userRepo.findByEmail(email);
		const foundAccounts = await this.accountRepo.findByUsername(email);

		if (
			foundUsers.length > 1 ||
			foundAccounts.length > 1 ||
			(foundUsers.length === 1 && foundUsers[0].id !== user.id) ||
			(foundAccounts.length === 1 && foundAccounts[0].id !== account.id)
		) {
			throw new ValidationError(`Die E-Mail Adresse ist bereits in Verwendung!`);
		}
	}
}
