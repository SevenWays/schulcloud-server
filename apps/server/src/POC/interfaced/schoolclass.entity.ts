import { EntityId } from '@shared/domain/types';
import { Person } from './person.entity';
import { School } from './school.entity';

export interface SchoolClassData {
	id: EntityId;
	grade: number;
	suffix: string;
	schoolId: EntityId; // not populated
	students: Person[]; // populated

	// OPTIONAL - TO BE DECIDED
	fetchSchool(): Promise<School>;
}

export class SchoolClass {
	constructor(data: SchoolClassData) {
		this.data = data;
	}

	data: SchoolClassData;

	get id() {
		return this.data.id;
	}

	get grade() {
		return this.data.grade;
	}

	set grade(value: number) {
		if (value < 1) {
			throw new Error('preschool not supported yet.');
		}
		if (value > 13) {
			throw new Error('german schools only have 13 grades.');
		}
		this.data.grade = value;
	}

	get suffix() {
		return this.data.suffix;
	}

	set suffix(value: string) {
		this.data.suffix = value;
	}

	get name() {
		return `${this.grade}${this.suffix}`;
	}

	get schoolId() {
		return this.data.schoolId;
	}

	get students() {
		return this.data.students;
	}

	addStudent(newInClass: Person) {
		this.data.students.push(newInClass);
	}

	removeStudent(kickedOutOfClass: Person) {
		const index = this.data.students.indexOf(kickedOutOfClass);
		if (index > -1) {
			this.data.students.splice(index, 1); // 2nd parameter means remove one item only
		}
	}

	// OPTIONAL - TO BE DECIDED
	async fetchSchool() {
		return this.data.fetchSchool();
	}
	// END OPTIONAL
}
