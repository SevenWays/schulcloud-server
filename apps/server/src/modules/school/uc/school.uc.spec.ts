import { Test, TestingModule } from '@nestjs/testing';
import { SchoolService } from '@src/modules/school/service/school.service';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '../../authorization';
import { PublicSchoolResponse } from '../controller/dto/public.school.response';
import { OauthMigrationDto } from '../dto/oauth-migration.dto';

describe('SchoolUc', () => {
	let module: TestingModule;
	let schoolUc: SchoolUc;
	let schoolService: DeepMocked<SchoolService>;
	let authService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolUc,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();
		schoolService = module.get(SchoolService);
		authService = module.get(AuthorizationService);
		schoolUc = module.get(SchoolUc);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('setMigration is called', () => {
		let migrationResponse: OauthMigrationDto;
		const mockId = 'someId';
		beforeAll(() => {
			migrationResponse = new OauthMigrationDto({
				oauthMigrationPossible: new Date(),
				oauthMigrationMandatory: new Date(),
				oauthMigrationFinished: new Date(),
				enableMigrationStart: true,
			});
			schoolService.setMigration.mockResolvedValue(migrationResponse);
			authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
		});

		describe('when migrationflags and schoolId and userId are given', () => {
			it('should call the service', async () => {
				await schoolUc.setMigration(mockId, true, true, true, mockId);

				expect(schoolService.setMigration).toHaveBeenCalledWith(mockId, true, true, true);
			});
		});
	});

	describe('getMigration is called', () => {
		let migrationResponse: OauthMigrationDto;
		const mockId = 'someId';
		beforeAll(() => {
			schoolService.getMigration.mockResolvedValue(migrationResponse);
			authService.checkPermissionByReferences.mockImplementation(() => Promise.resolve());
		});

		describe('when schoolId and UserId are given', () => {
			it('should call the service', async () => {
				await schoolUc.getMigration(mockId, mockId);

				expect(schoolService.getMigration).toHaveBeenCalledWith(mockId);
			});
		});
	});

	describe('when it calls the service to get public school data', () => {
		let schoolDO: SchoolDO;
		const mockSchoolnumber = '1234';
		beforeEach(() => {
			schoolDO = new SchoolDO({ name: 'mockSchool', officialSchoolNumber: '1234' });
			schoolService.getSchoolBySchoolNumber.mockResolvedValue(schoolDO);
		});
		it('should call the service and return an object', async () => {
			const response: PublicSchoolResponse = await schoolUc.getPublicSchoolData(mockSchoolnumber);

			expect(schoolService.getSchoolBySchoolNumber).toHaveBeenCalledWith(mockSchoolnumber);
			expect(response).not.toBeNull();
		});
		it('should call the service and throw an exception', async () => {
			schoolService.getSchoolBySchoolNumber.mockResolvedValue(null);
			const resp: Promise<PublicSchoolResponse> = schoolUc.getPublicSchoolData(mockSchoolnumber);
			await expect(resp).rejects.toThrow(NotFoundException);
		});
	});
});
