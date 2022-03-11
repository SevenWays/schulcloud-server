import { Entity, Collection, ManyToMany, OneToOne, IdentifiedReference, Reference, wrap } from '@mikro-orm/core';
import { Course } from '@shared/domain/entity/course.entity';
import { BoardElement } from '@shared/domain/entity/boardelement.entity';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';

export type BoardProps = {
	references: BoardElement[];
	course: Course;
};

export interface BoardData {
	courseId: EntityId;
	elements: BoardElement[];
}

@Entity({ tableName: 'boardinterfacedpoc' })
export class BoardDataMapperInterfaced extends BaseEntityWithTimestamps implements BoardData {
	constructor(props: BoardProps) {
		super();
		this.references.set(props.references);
		this.courseRef = wrap(props.course).toReference();
	}

	@OneToOne('Course', undefined, { wrappedReference: true, fieldName: 'courseId' })
	courseRef: IdentifiedReference<Course>;

	get courseId() {
		return this.courseRef.id;
	}

	set courseId(value: EntityId) {
		this.courseRef = Reference.createFromPK(Course, value);
	}

	@ManyToMany('BoardElement', undefined, {
		fieldName: 'referenceIds',
	})
	references = new Collection<BoardElement>(this);

	get elements() {
		return this.references.getItems();
	}

	set elements(value: BoardElement[]) {
		this.references.set(value);
	}
}
