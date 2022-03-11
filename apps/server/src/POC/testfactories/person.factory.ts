import { BaseFactory } from '../../shared/testing/factory/base.factory';
import { PersonDatamapper, PersonProps } from '../interfaced/person.datamapper';

export const personFactory = BaseFactory.define<PersonDatamapper, PersonProps>(PersonDatamapper, ({ sequence }) => {
	return {
		name: `person #${sequence}`,
	};
});
