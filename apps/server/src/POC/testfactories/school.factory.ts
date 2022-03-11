import { BaseFactory } from '../../shared/testing/factory/base.factory';
import { SchoolDataMapperPOC, SchoolProps } from '../interfaced/school.datamapper';

export const schoolFactory = BaseFactory.define<SchoolDataMapperPOC, SchoolProps>(
	SchoolDataMapperPOC,
	({ sequence }) => {
		return {
			name: `school #${sequence}`,
		};
	}
);
