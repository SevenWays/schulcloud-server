import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { EntityId, Lesson, Counted, SortOrder } from '@shared/domain';

import { LessonScope } from './lesson-scope';

@Injectable()
export class LessonRepo {
	constructor(private readonly em: EntityManager) {}

	async findAllByCourseIds(courseIds: EntityId[], filters?: { hidden?: boolean }): Promise<Counted<Lesson[]>> {
		const scope = new LessonScope();

		scope.byCourseIds(courseIds);

		if (filters?.hidden !== undefined) {
			scope.byHidden(filters.hidden);
		}

		const order = { position: SortOrder.asc };

		const [lessons, count] = await this.em.findAndCount(Lesson, scope.query, { orderBy: order });

		await this.em.populate(lessons, ['course']);

		return [lessons, count];
	}
}