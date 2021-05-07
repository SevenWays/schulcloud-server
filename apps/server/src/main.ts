import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { install } from 'source-map-support';
install(); // TODO register source-map-support to

import legacyAppPromise = require('../../../src/app');

import { ServerModule } from './server.module';
import path = require('path');

const ROUTE_PRAEFIX = 'v3';
const PORT = 3030;

async function bootstrap() {
	// load the legacy feathers/express server
	const legacyApp = await legacyAppPromise;
	const adapter = new ExpressAdapter(legacyApp);

	// create the NestJS application adapting the legacy  server
	const app = await NestFactory.create(ServerModule, adapter);

	// for all NestJS controller routes, prepend ROUTE_PRAEFIX
	app.setGlobalPrefix(ROUTE_PRAEFIX);

	/** *********************************************
	 * Global Pipe setup
	 * **********************************************
	 * Validation of DTOs will base on type-checking
	 * which is enabled by default. To you might use
	 * the class-validator decorators to extend
	 * validation.
	 */
	// transform and -options enables setting of defaults or initialization of empty arrays
	app.useGlobalPipes(
		// validation pipe ensures DTO validation globally
		new ValidationPipe({
			// enable DTO instance creation for incoming data
			transform: true,
			transformOptions: {
				// enable type coersion, requires transform:true
				enableImplicitConversion: true,
			},
			whitelist: true, // only pass valid @ApiProperty-decorated DTO properties, remove others
			forbidNonWhitelisted: true, // when whitelist is true, fail when additional invalid parameters are received
		})
	);
	/** *********************************************
	 * Global Interceptor setup
	 * **********************************************
	 * Validation of DTOs will base on type-checking
	 * which is enabled by default. To you might use
	 * the class-validator decorators to extend
	 * validation.
	 */
	// app.useGlobalInterceptors(ClassSerializerInterceptor);

	/** *********************************************
	 * OpenAPI docs setup
	 * **********************************************
	 * They will be generated by Controller routes
	 * and DTOs/Entities passed. Their properties
	 * must use @ApiProperty
	 */

	// build default openapi spec, it contains all registered controllers by default
	// DTO's and Entity properties have to use @ApiProperty decorator to add their properties
	const config = new DocumentBuilder()
		.setTitle('HPI Schul-Cloud Server API')
		.setDescription('This is v3 of HPI Schul-Cloud Server. Checkout /docs for v1.')
		.setVersion('3.0')
		/** set authentication for all routes enabled by default */
		.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
		.build();
	const document = SwaggerModule.createDocument(app, config);
	const apiDocsPath = 'v3/api';
	SwaggerModule.setup(apiDocsPath, app, document);

	// setup legacy app since that's not called automatically by app.listen()
	await legacyApp.setup();

	await app.init();

	adapter.listen(PORT);
}
bootstrap();
