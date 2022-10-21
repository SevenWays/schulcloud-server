import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { NodeEnvType } from '@src/modules/server/server.config';
import { KeycloakManagementUc } from '../uc/Keycloak-management.uc';
import { KeycloakManagementController } from './keycloak-management.controller';

describe('KeycloakManagementController', () => {
	let uc: DeepMocked<KeycloakManagementUc>;
	let controller: KeycloakManagementController;
	let configServiceMock: DeepMocked<ConfigService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [KeycloakManagementController],
			providers: [
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: KeycloakManagementUc,
					useValue: createMock<KeycloakManagementUc>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		uc = module.get(KeycloakManagementUc);
		controller = module.get(KeycloakManagementController);
		configServiceMock = module.get(ConfigService);
	});

	beforeEach(() => {
		uc.check.mockResolvedValue(true);
		uc.seed.mockResolvedValue(1);
		uc.configure.mockResolvedValue(1);
		configServiceMock.get.mockReturnValue(NodeEnvType.TEST);
	});

	afterEach(() => {
		uc.check.mockRestore();
		uc.seed.mockRestore();
		uc.configure.mockRestore();
		configServiceMock.get.mockRestore();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('importSeedData', () => {
		it('should accept calls on seed route', async () => {
			const received = await controller.importSeedData();
			expect(received).toBe(1);
		});
		it('should call configure with param true', async () => {
			const received = await controller.importSeedData();
			expect(received).toBe(1);
		});
		it('should return -1 if connection ok but seed fails', async () => {
			uc.seed.mockRejectedValue('seeding error');

			const received = await controller.importSeedData();
			expect(received).toBe(-1);

			uc.seed.mockRestore();
		});
		it('should throw if connection fails', async () => {
			uc.check.mockResolvedValue(false);
			uc.seed.mockRejectedValue('seeding error');

			await expect(controller.importSeedData()).rejects.toThrow(ServiceUnavailableException);

			uc.check.mockRestore();
			uc.seed.mockRestore();
		});
	});
});
