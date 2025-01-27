import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { MikroORM } from '@mikro-orm/core';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemService } from '@src/modules/system/service/system.service';
import { OauthConfig, System } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { DefaultEncryptionService, IEncryptionService, SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { Logger } from '@src/core/logger';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/authorization.params';
import { UserService } from '@src/modules/user';
import { ObjectId } from 'bson';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ProvisioningDto, ProvisioningService } from '@src/modules/provisioning';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { UserMigrationService } from '@src/modules/user-login-migration';
import { OauthConfigDto } from '@src/modules/system/service';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { OauthTokenResponse } from '../controller/dto';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { IJwt } from '../interface/jwt.base.interface';
import { OAuthService } from './oauth.service';
import { ExternalSchoolDto, ExternalUserDto, OauthDataDto, ProvisioningSystemDto } from '../../provisioning/dto';
import { OauthAdapterService } from './oauth-adapter.service';
import { SSOAuthenticationError } from '../interface/sso-authentication-error.enum';
import { OAuthProcessDto } from './dto/oauth-process.dto';

jest.mock('jwks-rsa', () => () => {
	return {
		getKeys: jest.fn(),
		getSigningKey: jest.fn().mockResolvedValue({
			kid: 'kid',
			alg: 'alg',
			getPublicKey: jest.fn().mockReturnValue('publicKey'),
			rsaPublicKey: 'publicKey',
		}),
		getSigningKeys: jest.fn(),
	};
});

jest.mock('jsonwebtoken');

describe('OAuthService', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: OAuthService;
	let oAuthEncryptionService: DeepMocked<SymetricKeyEncryptionService>;
	let provisioningService: DeepMocked<ProvisioningService>;
	let userService: DeepMocked<UserService>;
	let systemService: DeepMocked<SystemService>;
	let userMigrationService: DeepMocked<UserMigrationService>;
	let oauthAdapterService: DeepMocked<OauthAdapterService>;

	let testSystem: System;
	let testSystemDto: SystemDto;
	let testOauthConfig: OauthConfig;

	const hostUri = 'https://mock.de';

	beforeAll(async () => {
		orm = await setupEntities();

		jest.spyOn(Configuration, 'get').mockImplementation((key: string): unknown => {
			switch (key) {
				case 'HOST':
				case 'PUBLIC_BACKEND_URL':
					return hostUri;
				default:
					throw new Error(`No mock for key '${key}'`);
			}
		});

		module = await Test.createTestingModule({
			providers: [
				OAuthService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<IEncryptionService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ProvisioningService,
					useValue: createMock<ProvisioningService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: UserMigrationService,
					useValue: createMock<UserMigrationService>(),
				},
				{
					provide: OauthAdapterService,
					useValue: createMock<OauthAdapterService>(),
				},
			],
		}).compile();
		service = module.get(OAuthService);

		oAuthEncryptionService = module.get(DefaultEncryptionService);
		provisioningService = module.get(ProvisioningService);
		userService = module.get(UserService);
		systemService = module.get(SystemService);
		userMigrationService = module.get(UserMigrationService);
		oauthAdapterService = module.get(OauthAdapterService);
	});

	afterAll(async () => {
		jest.clearAllMocks();
		await module.close();
		await orm.close();
	});

	beforeEach(() => {
		testSystem = systemFactory.withOauthConfig().buildWithId();
		testSystemDto = SystemMapper.mapFromEntityToDto(testSystem);
		testOauthConfig = testSystem.oauthConfig as OauthConfig;
	});

	describe('checkAuthorizationCode', () => {
		describe('when it gets passed a query with a code', () => {
			it('should extract code from query', () => {
				const code = '43534543jnj543342jn2';
				const query: AuthorizationParams = { code, state: 'someState' };

				const extract: string = service.checkAuthorizationCode(query);

				expect(extract).toBe(code);
			});
		});
		describe('when it gets passed a query with an error', () => {
			it('should throw an error', () => {
				const query: AuthorizationParams = { error: SSOAuthenticationError.INVALID_REQUEST, state: 'someState' };

				expect(() => service.checkAuthorizationCode(query)).toThrow(
					new OAuthSSOError('Authorization Query Object has no authorization code or error', 'error')
				);
			});
		});

		describe('when it gets passed a faulty query', () => {
			it('should throw an error', () => {
				const query: AuthorizationParams = {} as AuthorizationParams;

				expect(() => service.checkAuthorizationCode(query)).toThrow(
					new OAuthSSOError('Authorization Query Object has no authorization code or error', 'sso_auth_code_step')
				);
			});
		});
	});
	describe('requestToken', () => {
		const setupRequest = () => {
			const code = '43534543jnj543342jn2';
			const tokenResponse: OauthTokenResponse = {
				access_token: 'accessToken',
				refresh_token: 'refreshToken',
				id_token: 'idToken',
			};

			return {
				code,
				tokenResponse,
			};
		};

		beforeEach(() => {
			const { tokenResponse } = setupRequest();
			oAuthEncryptionService.decrypt.mockReturnValue('decryptedSecret');
			oauthAdapterService.sendTokenRequest.mockResolvedValue(tokenResponse);
		});

		describe('when it requests a token', () => {
			it('should get token from the external server', async () => {
				const { code, tokenResponse } = setupRequest();
				const responseToken: OauthTokenResponse = await service.requestToken(code, testOauthConfig);

				expect(responseToken).toStrictEqual(tokenResponse);
			});
		});
	});

	describe('validateToken', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});
		describe('when the token is validated', () => {
			it('should validate id_token and return it decoded', async () => {
				jest.spyOn(jwt, 'verify').mockImplementationOnce((): JwtPayload => {
					return { sub: 'mockSub' };
				});

				const decodedJwt: IJwt = await service.validateToken('idToken', testOauthConfig);

				expect(decodedJwt.sub).toStrictEqual('mockSub');
			});
		});

		describe('if no payload was returned', () => {
			it('should throw', async () => {
				jest.spyOn(jwt, 'verify').mockImplementationOnce((): string => 'string');

				await expect(service.validateToken('idToken', testOauthConfig)).rejects.toEqual(
					new OAuthSSOError('Failed to validate idToken', 'sso_token_verfication_error')
				);
			});
		});
	});
	describe('findUser', () => {
		const decodedJwtMock = { sub: new ObjectId().toHexString(), email: 'peter.tester@example.com' };
		beforeEach(() => {
			jest.spyOn(jwt, 'decode').mockImplementation((): JwtPayload => decodedJwtMock);
		});
		describe('findUser is called', () => {
			const setupJwt = () => {
				const decodedJwt: JwtPayload = {
					sub: new ObjectId().toHexString(),
					email: 'peter.tester@example.com',
				};

				jest.spyOn(jwt, 'decode').mockReturnValue(decodedJwt);

				return {
					decodedJwt,
				};
			};
			const setupUser = () => {
				const externalUserId = 'externalUserId';
				const user: UserDO = new UserDO({
					firstName: 'firstName',
					lastName: 'lastName',
					email: 'email',
					schoolId: 'schoolId',
					roleIds: ['roleId'],
					externalId: externalUserId,
				});
				return { externalUserId, user };
			};

			afterEach(() => {
				jest.clearAllMocks();
			});

			describe('when an external id is given', () => {
				it('should return the user according to the externalId', async () => {
					setupJwt();
					const { externalUserId, user } = setupUser();

					userService.findByExternalId.mockResolvedValueOnce(user);

					const result: UserDO = await service.findUser('idToken', externalUserId, testSystem.id);

					expect(result).toEqual(user);
				});
			});

			describe('when no user is found with this id and give helpful context', () => {
				it('should throw', async () => {
					setupJwt();
					userService.findByExternalId.mockResolvedValueOnce(null);

					try {
						await service.findUser('accessToken', 'idToken', testSystem.id);
					} catch (error) {
						expect(error).toBeInstanceOf(OAuthSSOError);
						expect((error as OAuthSSOError).message).toContain('currentLdapId');
					}
				});
			});

			describe('when idToken is invalid and has no sub', () => {
				it('should throw', async () => {
					jest.spyOn(jwt, 'decode').mockImplementationOnce(() => null);

					await expect(service.findUser('accessToken', 'idToken', testSystem.id)).rejects.toThrow(BadRequestException);
				});
			});
			describe('when no user is found with this id', () => {
				it('should throw OAuthSSOError and give helpful context', async () => {
					setupJwt();
					const { externalUserId } = setupUser();
					const schoolId = new ObjectId().toHexString();
					userService.findByExternalId.mockResolvedValueOnce(null);
					userService.findByEmail.mockResolvedValue([
						userFactory.buildWithId({
							school: schoolFactory.buildWithId(undefined, schoolId),
							externalId: externalUserId,
						}),
					]);

					const promise: Promise<UserDO> = service.findUser('idToken', externalUserId, testSystem.id);

					await expect(promise).rejects.toThrow(OAuthSSOError);
				});
			});

			describe('when the token has no email information', () => {
				it('should throw without additional information', async () => {
					const { decodedJwt } = setupJwt();
					jest.spyOn(jwt, 'decode').mockReturnValue({ ...decodedJwt, email: undefined });
					const externalUserId = '321-my-current-ldap-id';
					userService.findByExternalId.mockResolvedValueOnce(null);

					const promise: Promise<UserDO> = service.findUser('idToken', externalUserId, testSystem.id);

					await expect(promise).rejects.toThrow(OAuthSSOError);
				});
			});

			describe('when the id token has no sub', () => {
				it('should throw BadRequestException', async () => {
					jest.spyOn(jwt, 'decode').mockReturnValue(null);

					await expect(service.findUser('accessToken', 'idToken', testSystem.id)).rejects.toThrow(BadRequestException);
				});
			});
		});
	});

	describe('getRedirectUrl', () => {
		describe('when it is called with an iserv-provider', () => {
			it('should return an iserv login url string', () => {
				const url = service.getPostLoginRedirectUrl('iserv', 'idToken', 'https://mock.de');

				expect(url).toStrictEqual(
					`https://mock.de/?id_token_hint=idToken&post_logout_redirect_uri=https%3A%2F%2Fmock.de%2Fdashboard`
				);
			});
		});

		describe('when it is called with any other oauth provider', () => {
			it('should return a login url string', () => {
				const url: string = service.getPostLoginRedirectUrl('provider');

				expect(url).toStrictEqual(`${hostUri}/dashboard`);
			});
		});
	});

	describe('authorizeForMigration', () => {
		const setupMigration = () => {
			const query: AuthorizationParams = { code: '43534543jnj543342jn2', state: 'someState' };

			const oauthConfig: OauthConfigDto = new OauthConfigDto({
				clientId: '12345',
				clientSecret: 'mocksecret',
				alias: 'alias',
				tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
				grantType: 'authorization_code',
				scope: 'openid uuid',
				responseType: 'code',
				authEndpoint: 'mock_authEndpoint',
				provider: 'mock_provider',
				logoutEndpoint: 'mock_logoutEndpoint',
				issuer: 'mock_issuer',
				jwksEndpoint: 'mock_jwksEndpoint',
				redirectUri: 'mock_codeRedirectUri',
			});
			const system: SystemDto = new SystemDto({
				id: 'systemId',
				type: 'oauth',
				oauthConfig,
			});

			const oauthTokenResponse: OauthTokenResponse = {
				access_token: 'accessToken',
				refresh_token: 'refreshToken',
				id_token: 'idToken',
			};

			const oauthData: OauthDataDto = new OauthDataDto({
				system: new ProvisioningSystemDto({
					systemId: 'systemId',
					provisioningStrategy: SystemProvisioningStrategy.SANIS,
				}),
				externalUser: new ExternalUserDto({
					externalId: 'externalUserId',
				}),
			});

			provisioningService.getData.mockResolvedValue(oauthData);

			return {
				query,
				system,
				oauthTokenResponse,
			};
		};

		describe('when the function is called with a valid query', () => {
			it('should return a query token', async () => {
				const { query, system, oauthTokenResponse } = setupMigration();
				systemService.findById.mockResolvedValue(system);
				userMigrationService.getMigrationRedirectUri.mockReturnValue('mockRedirect');
				oauthAdapterService.sendTokenRequest.mockResolvedValue(oauthTokenResponse);

				const response = await service.authorizeForMigration(query, 'systemId');

				expect(response).toEqual(oauthTokenResponse);
			});
		});

		describe('when no system is found', () => {
			it('should throw an error', async () => {
				const { query } = setupMigration();
				systemService.findById.mockResolvedValue({} as SystemDto);

				const response = service.authorizeForMigration(query, 'noSystemId');

				await expect(response).rejects.toThrow(NotFoundException);
			});
		});
	});
	describe('authenticateUser', () => {
		const setup = () => {
			const code = '43534543jnj543342jn2';
			const query: AuthorizationParams = { code, state: 'someState' };

			const oauthConfig: OauthConfigDto = new OauthConfigDto({
				clientId: '12345',
				clientSecret: 'mocksecret',
				alias: 'alias',
				tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
				grantType: 'authorization_code',
				scope: 'openid uuid',
				responseType: 'code',
				authEndpoint: 'mock_authEndpoint',
				provider: 'mock_provider',
				logoutEndpoint: 'mock_logoutEndpoint',
				issuer: 'mock_issuer',
				jwksEndpoint: 'mock_jwksEndpoint',
				redirectUri: 'mock_codeRedirectUri',
			});
			const system: SystemDto = new SystemDto({
				id: 'systemId',
				type: 'oauth',
				oauthConfig,
			});

			const oauthTokenResponse: OauthTokenResponse = {
				access_token: 'accessToken',
				refresh_token: 'refreshToken',
				id_token: 'idToken',
			};

			const externalUserId = 'externalUserId';
			const mockUser: UserDO = new UserDO({
				firstName: 'firstName',
				lastName: 'lastName',
				email: 'email',
				schoolId: 'schoolId',
				roleIds: ['roleId'],
				externalId: externalUserId,
			});
			const oauthData: OauthDataDto = new OauthDataDto({
				system: new ProvisioningSystemDto({
					systemId: 'systemId',
					provisioningStrategy: SystemProvisioningStrategy.OIDC,
				}),
				externalUser: new ExternalUserDto({
					externalId: externalUserId,
				}),
			});
			const provisioningDto: ProvisioningDto = new ProvisioningDto({
				externalUserId,
			});

			const postLoginRedirect = 'postLoginRedirect';
			const successResponse: OAuthProcessDto = new OAuthProcessDto({
				redirect: postLoginRedirect,
			});

			const userJwt = 'schulcloudJwt';

			const decodedJwtMock = { sub: new ObjectId().toHexString(), email: 'peter.tester@example.com' };

			provisioningService.getData.mockResolvedValue(oauthData);
			provisioningService.provisionData.mockResolvedValue(provisioningDto);
			jest.spyOn(jwt, 'decode').mockImplementation((): JwtPayload => decodedJwtMock);
			oAuthEncryptionService.decrypt.mockReturnValue('decryptedSecret');
			oauthAdapterService.sendTokenRequest.mockResolvedValue(oauthTokenResponse);

			return {
				query,
				system,
				externalUserId,
				mockUser,
				oauthData,
				oauthTokenResponse,
				provisioningDto,
				userJwt,
				oauthConfig,
				postLoginRedirect,
				successResponse,
			};
		};

		afterEach(() => {
			userService.findByExternalId.mockReset();
			systemService.findById.mockReset();
		});
		// const mockSystemDto: SystemDto = {};

		it('should authenticate a user', async () => {
			const { query, system, mockUser } = setup();
			systemService.findById.mockResolvedValueOnce(testSystemDto);
			userService.findByExternalId.mockResolvedValue(mockUser);

			const systemId = system.id;
			if (!systemId) {
				fail('System id is not defined');
			}
			const { user, redirect } = await service.authenticateUser(systemId, query.code);
			expect(redirect).toStrictEqual(`${hostUri}/dashboard`);
			expect(user).toStrictEqual(mockUser);
		});

		describe('when system id does not exist (impossible case)', () => {
			it('the authentication should fail', async () => {
				const { query, mockUser } = setup();

				systemService.findById.mockResolvedValue({} as SystemDto);
				userService.findByExternalId.mockResolvedValue(mockUser);

				await expect(service.authenticateUser('', query.code)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when system does not have oauth config', () => {
			it('the authentication should fail', async () => {
				const { query, mockUser, system } = setup();
				system.oauthConfig = undefined;

				systemService.findById.mockResolvedValueOnce(system);
				userService.findByExternalId.mockResolvedValue(mockUser);

				await expect(service.authenticateUser(testSystem.id, query.code)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when query has no code or error', () => {
			it('should throw an error', async () => {
				const response = service.authenticateUser('');

				await expect(response).rejects.toThrow(OAuthSSOError);
			});
		});

		describe('when the provisioning returns a school with an officialSchoolNumber', () => {
			const setupMigration = () => {
				const setupData = setup();
				const migrationRedirect = 'https://mock.de/dashboard';
				const migrationResponse: OAuthProcessDto = new OAuthProcessDto({
					redirect: migrationRedirect,
				});

				setupData.oauthData.externalSchool = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
					name: 'schoolName',
					officialSchoolNumber: 'officialSchoolNumber',
				});

				userMigrationService.getMigrationRedirect.mockResolvedValueOnce(migrationRedirect);

				return {
					...setupData,
					migrationRedirect,
					migrationResponse,
				};
			};
			describe('when the school is currently migrating to another system and the user does not exist', () => {
				it('should return a migration redirect url', async () => {
					const { query, migrationRedirect, system } = setupMigration();

					systemService.findById.mockResolvedValueOnce(system);
					userService.findByExternalId.mockResolvedValue(null);
					userMigrationService.isSchoolInMigration.mockResolvedValueOnce(true);

					const { user, redirect } = await service.authenticateUser('brokenId', query.code);

					expect(redirect).toEqual(migrationRedirect);
					expect(user).toBeUndefined();
				});
			});

			describe('when the school is currently migrating to another system and the user exists', () => {
				it('should should finish the process normally and return a valid jwt', async () => {
					const { query, mockUser, migrationRedirect, system } = setupMigration();

					systemService.findById.mockResolvedValueOnce(system);
					userService.findByExternalId.mockResolvedValue(mockUser);
					userMigrationService.isSchoolInMigration.mockResolvedValueOnce(false);

					const { user, redirect } = await service.authenticateUser('brokenId', query.code);

					expect(redirect).toEqual(migrationRedirect);
					expect(user).toEqual(mockUser);
				});
			});
		});
	});
	describe('getPostLoginRedirectUrl is called', () => {
		describe('when the provider is iserv and no postLoginRedirect', () => {
			it('should return an iserv logout url', () => {
				const url = service.getPostLoginRedirectUrl('iserv', 'idToken', 'http://iserv.logout');

				expect(url).toStrictEqual(
					`http://iserv.logout/?id_token_hint=idToken&post_logout_redirect_uri=https%3A%2F%2Fmock.de%2Fdashboard`
				);
			});
		});

		describe('when the provider is iserv and a postLoginRedirect is provided', () => {
			it('should return an iserv logout url', () => {
				const url = service.getPostLoginRedirectUrl(
					'iserv',
					'idToken',
					'http://iserv.logout',
					'specialPostLoginRedirectUrl'
				);

				expect(url).toStrictEqual(
					`http://iserv.logout/?id_token_hint=idToken&post_logout_redirect_uri=specialPostLoginRedirectUrl`
				);
			});
		});

		describe('when a normal provider is provided and no postLoginRedirect', () => {
			it('should return a login url string', () => {
				const url: string = service.getPostLoginRedirectUrl('provider');

				expect(url).toStrictEqual(`${hostUri}/dashboard`);
			});
		});

		describe('when a normal provider and a postLoginRedirect is provided', () => {
			it('should return a login url string', () => {
				const url: string = service.getPostLoginRedirectUrl('provider', '', '', 'specialPostLoginRedirectUrl');

				expect(url).toStrictEqual('specialPostLoginRedirectUrl');
			});
		});
	});

	describe('getAuthenticationUrl is called', () => {
		describe('when a normal authentication url is requested', () => {
			it('should return a authentication url', () => {
				const oauthConfig: OauthConfig = new OauthConfig({
					alias: 'alias',
					clientId: '12345',
					clientSecret: 'mocksecret',
					tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
					grantType: 'authorization_code',
					redirectUri: 'http://mockhost:3030/api/v3/sso/oauth/testsystemId',
					scope: 'openid uuid',
					responseType: 'code',
					authEndpoint: 'http://mock.de/auth',
					provider: 'mock_type',
					logoutEndpoint: 'http://mock.de/logout',
					issuer: 'mock_issuer',
					jwksEndpoint: 'http://mock.de/jwks',
				});

				const result: string = service.getAuthenticationUrl('oidc', oauthConfig, 'state', false, 'alias');

				expect(result).toEqual(
					'http://mock.de/auth?client_id=12345&redirect_uri=https%3A%2F%2Fmock.de%2Fapi%2Fv3%2Fsso%2Foauth&response_type=code&scope=openid+uuid&state=state&kc_idp_hint=alias'
				);
			});
		});

		describe('when a migration authentication url is requested', () => {
			it('should return a authentication url', () => {
				const oauthConfig: OauthConfig = new OauthConfig({
					alias: 'alias',
					clientId: '12345',
					clientSecret: 'mocksecret',
					tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
					grantType: 'authorization_code',
					redirectUri: 'http://mockhost.de/api/v3/sso/oauth/testsystemId',
					scope: 'openid uuid',
					responseType: 'code',
					authEndpoint: 'http://mock.de/auth',
					provider: 'mock_type',
					logoutEndpoint: 'http://mock.de/logout',
					issuer: 'mock_issuer',
					jwksEndpoint: 'http://mock.de/jwks',
				});

				const result: string = service.getAuthenticationUrl('oidc', oauthConfig, 'state', true, 'alias');

				expect(result).toEqual(
					'http://mock.de/auth?client_id=12345&redirect_uri=https%3A%2F%2Fmock.de%2Fapi%2Fv3%2Fsso%2Foauth%2Fmigration&response_type=code&scope=openid+uuid&state=state&kc_idp_hint=alias'
				);
			});
		});
	});
});
