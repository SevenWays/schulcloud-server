import { Entity, Collection, ManyToMany, OneToOne, IdentifiedReference, wrap } from '@mikro-orm/core';
import { Course } from '@shared/domain/entity/course.entity';
import { BoardElement } from '@shared/domain/entity/boardelement.entity';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';

export type BoardProps = {
	references: BoardElement[];
	course: Course;
};

@Entity({ tableName: 'boardsimplepoc' })
export class BoardDataMapperSimple extends BaseEntityWithTimestamps {
	constructor(props: BoardProps) {
		super();
		this.references.set(props.references);
		this.course = wrap(props.course).toReference();
	}

	@OneToOne('Course', undefined, { wrappedReference: true, fieldName: 'courseId' })
	course: IdentifiedReference<Course>;

	@ManyToMany('BoardElement', undefined, { fieldName: 'referenceIds' })
	references = new Collection<BoardElement>(this);
}
