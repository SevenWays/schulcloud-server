import { Entity, Collection, ManyToMany, OneToOne, IdentifiedReference, wrap, EntityDTO } from '@mikro-orm/core';
import { Course } from '@shared/domain/entity/course.entity';
import { BoardElement } from '@shared/domain/entity/boardelement.entity';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';

export type BoardProps = {
	references: BoardElement[];
	course: Course;
};

export type SerializedBoardData = {
	course: EntityId;
	references: BoardElement[];
};

@Entity({ tableName: 'boardserializepoc' })
export class BoardDataMapperSerialize extends BaseEntityWithTimestamps {
	constructor(props: BoardProps) {
		super();
		this.references.set(props.references);
		this.course = wrap(props.course).toReference();
	}

	@OneToOne('Course', undefined, {
		wrappedReference: true,
		fieldName: 'courseId',
		serializer: (value: IdentifiedReference<Course>) => value.id,
	})
	course: IdentifiedReference<Course>;

	@ManyToMany('BoardElement', undefined, {
		fieldName: 'referenceIds',
		serializer: (value: Collection<BoardElement>) => {
			const items = value.getItems();
			const serializedItems = items.map((item) => wrap(item).toObject());
			return serializedItems;
		},
	})
	references = new Collection<BoardElement>(this);

	toObject(): EntityDTO<this> {
		const obj = wrap(this).toObject();
		const dto = obj as unknown as SerializedBoardData;
		return obj;
	}
}
