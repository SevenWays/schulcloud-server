import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { BoardElementData } from './boardelement.entity';

export type BoardElementProps = {
	title: string;
};

@Entity({ tableName: 'boardelementinterfacedpoc' })
export class BoardElementDataMapperPOC extends BaseEntityWithTimestamps implements BoardElementData {
	constructor(props: BoardElementProps) {
		super();
		this.title = props.title;
	}

	@Property()
	title: string;
}
