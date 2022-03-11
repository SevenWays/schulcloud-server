import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { EntityId } from '@shared/domain';
import { SchoolClass } from './schoolclass.entity';
import { SchoolClassDatamapperPOC } from './schoolclass.datamapper';
import { School } from './school.entity';

@Injectable()
export class SchoolClassRepoPOC {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<SchoolClass> {
		const data = await this.em.findOneOrFail(SchoolClassDatamapperPOC, { id });
		await this.populateSchoolClass(data);
		const entity = new SchoolClass(data);
		return entity;
	}

	private async populateSchoolClass(data: SchoolClassDatamapperPOC) {
		await data.studentRefs.init();
		return data;
	}

	async persistAndFlush(schoolClass: SchoolClass): Promise<void> {
		// TODO: be able to pass Datamapper
		await this.em.persistAndFlush(schoolClass.data as SchoolClassDatamapperPOC);
		return Promise.resolve();
	}

	// OPTIONAL - TO BE DECIDED
	async getSchoolForClass(schoolClass: SchoolClass): Promise<School> {
		const data = schoolClass.data as SchoolClassDatamapperPOC;
		await this.em.populate(data, ['schoolRef']);
		const schoolData = data.schoolRef.getEntity();
		return new School(schoolData);
	}
	// OPTIONAL - TO BE DECIDED
}
