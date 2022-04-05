import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { System } from '@shared/domain';

@Injectable()
export class SystemRepo extends BaseRepo<System> {
	protected get entityName() {
		return System;
	}
}
