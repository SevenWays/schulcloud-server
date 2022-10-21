import { S3Client } from '@aws-sdk/client-s3';
import { Configuration } from '@hpi-schul-cloud/commons';
import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { HttpModule } from '@nestjs/axios';
import { Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain';
import { AntivirusModule } from '@shared/infra/antivirus/antivirus.module';
import { RabbitMQWrapperModule } from '@shared/infra/rabbitmq/rabbitmq.module';
import { FileRecordRepo } from '@shared/repo';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationModule } from '@src/modules/authorization';
import { S3ClientAdapter } from './client/s3-client.adapter';
import { config, s3Config } from './files-storage.config';
import { FilesStorageHelper } from './helper';
import { S3Config } from './interface/config';
import { FilesStorageService } from './service/files-storage.service';
import { FileRecordUC } from './uc/file-record.uc';
import { FilesStorageUC } from './uc/files-storage.uc';

const imports = [
	AuthorizationModule, // After refactoring, move to FilesStorageApiModule AuthorizationModule,
	LoggerModule,
	ConfigModule.forRoot({
		isGlobal: true,
		load: [config],
	}),
	HttpModule,
	AntivirusModule.forRoot({
		enabled: Configuration.get('ENABLE_FILE_SECURITY_CHECK') as boolean,
		filesServiceBaseUrl: Configuration.get('FILES_STORAGE__SERVICE_BASE_URL') as string,
		exchange: Configuration.get('ANTIVIRUS_EXCHANGE') as string,
		routingKey: Configuration.get('ANTIVIRUS_ROUTING_KEY') as string,
	}),
];
const providers = [
	FilesStorageUC, // After refactoring, move to FilesStorageApiModule  FilesStorageUC, FileRecordUC
	FileRecordUC,
	FilesStorageService,
	FilesStorageHelper,
	{
		provide: 'S3_Client',
		useFactory: (configProvider: S3Config) => {
			return new S3Client({
				region: configProvider.region,
				credentials: {
					accessKeyId: configProvider.accessKeyId,
					secretAccessKey: configProvider.secretAccessKey,
				},
				endpoint: configProvider.endpoint,
				forcePathStyle: true,
				tls: true,
			});
		},
		inject: ['S3_Config'],
	},
	{
		provide: 'S3_Config',
		useValue: s3Config,
	},
	S3ClientAdapter,
	FileRecordRepo,
];

const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
	},
};

@Module({
	imports: [
		...imports,
		RabbitMQWrapperModule,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			type: 'mongo',
			// TODO add mongoose options as mongo options (see database.js)
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,

			// debug: true, // use it for locally debugging of querys
		}),
	],
	providers,
	exports: [FilesStorageService, FilesStorageUC, FileRecordUC], // After refactoring, remove  FilesStorageUC, FileRecordUC
})
export class FilesStorageModule {}
