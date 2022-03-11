import { BaseFactory } from '../../shared/testing/factory/base.factory';
import { SchoolClassDatamapperPOC, SchoolClassProps } from '../interfaced/schoolclass.datamapper';
import { schoolFactory } from './school.factory';

export const schoolClassFactory = BaseFactory.define<SchoolClassDatamapperPOC, SchoolClassProps>(
	SchoolClassDatamapperPOC,
	({ sequence }) => {
		return {
			grade: 3,
			suffix: `b #${sequence}`,
			schoolId: schoolFactory.buildWithId().id,
			students: [],
		};
	}
);
