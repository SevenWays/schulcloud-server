import { Entity, OneToOne, IdentifiedReference, Reference, Property, Collection, ManyToMany } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { SchoolClassData } from './schoolclass.entity';
import { SchoolDataMapperPOC } from './school.datamapper';
import { Person } from './person.entity';
import { PersonDatamapper } from './person.datamapper';
import { School } from './school.entity';

export type SchoolClassProps = {
	grade: number;
	suffix: string;
	schoolId: EntityId;
	students: PersonDatamapper[];
};

@Entity({ tableName: 'schoolclasspoc' })
export class SchoolClassDatamapperPOC extends BaseEntityWithTimestamps implements SchoolClassData {
	constructor(props: SchoolClassProps) {
		super();
		this.suffix = props.suffix;
		this.grade = props.grade;
		this.schoolRef = Reference.createFromPK(SchoolDataMapperPOC, props.schoolId);
		this.studentRefs.set(props.students);
	}

	@Property()
	suffix: string;

	@Property()
	grade: number;

	@OneToOne('SchoolDataMapperPOC', undefined, { wrappedReference: true, fieldName: 'schoolId' })
	schoolRef: IdentifiedReference<SchoolDataMapperPOC>;

	get schoolId() {
		return this.schoolRef.id;
	}

	set schoolId(value: EntityId) {
		this.schoolRef = Reference.createFromPK(SchoolDataMapperPOC, value);
	}

	// OPTIONAL - TO BE DECIDED
	async fetchSchool(): Promise<School> {
		const data = await this.schoolRef.load();
		return new School(data);
	}
	// END OPTIONAL

	@ManyToMany('PersonDatamapper', undefined, {
		fieldName: 'studentIds',
	})
	studentRefs = new Collection<PersonDatamapper>(this);

	get students() {
		if (!this.studentRefs.isInitialized) {
			throw new Error('studentRefs should be initialized');
		}
		return this.studentRefs.getItems().map((ref) => ref.entity);
	}

	set students(value: Person[]) {
		const refs = value.map((person) => person.data as PersonDatamapper);
		this.studentRefs.set(refs);
	}
}
