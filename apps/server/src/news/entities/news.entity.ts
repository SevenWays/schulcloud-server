import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { News } from '../interfaces/news.interface';

export class NewsEntity {
	schoolId: ObjectId;

	title: string;
	content: string;
	displayAt: Date;

	creatorId?: ObjectId;
	updaterId?: ObjectId;

	createdAt: Date;
	updatedAt?: Date;

	externalId?: string;
	source: 'internal' | 'rss';
	sourceDescription?: string;

	// target and targetModel must exist or not exist
	target?: ObjectId;
	targetModel?: string;
}
