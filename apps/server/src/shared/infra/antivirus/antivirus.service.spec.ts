import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory } from '@shared/testing';
import { FileRecord } from '@src/modules/files-storage/entity/filerecord.entity';
import { AntivirusService } from './antivirus.service';

describe('AntivirusService', () => {
	let module: TestingModule;
	let service: AntivirusService;
	let amqpConnection: DeepMocked<AmqpConnection>;

	const antivirusServiceOptions = {
		enabled: true,
		filesServiceBaseUrl: 'http://localhost',
		exchange: 'exchange',
		routingKey: 'routingKey',
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AntivirusService,
				{ provide: AmqpConnection, useValue: createMock<AmqpConnection>() },
				{ provide: 'ANTIVIRUS_SERVICE_OPTIONS', useValue: antivirusServiceOptions },
			],
		}).compile();

		service = module.get(AntivirusService);
		amqpConnection = module.get(AmqpConnection);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('send()', () => {
		let fileRecord: FileRecord;

		beforeEach(() => {
			fileRecord = fileRecordFactory.build();
			fileRecord.securityCheck.requestToken = 'test-token';
		});

		it('should send given data to queue', () => {
			service.send(fileRecord);

			const expectedParams = [
				antivirusServiceOptions.exchange,
				antivirusServiceOptions.routingKey,
				{
					callback_uri: 'http://localhost/api/v3/file-security/update-status/test-token',
					download_uri: 'http://localhost/api/v3/file-security/download/test-token',
				},

				{ persistent: true },
			];
			expect(amqpConnection.publish).toHaveBeenCalledWith(...expectedParams);
		});

		it('should throw with InternalServerErrorException by error', () => {
			amqpConnection.publish.mockImplementationOnce(() => {
				throw new Error('fail');
			});

			expect(() => service.send(fileRecord)).toThrow(InternalServerErrorException);
		});
	});
});
