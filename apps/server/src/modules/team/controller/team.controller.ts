import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { PaginationQuery } from '@shared/controller/';
import { ICurrentUser } from '@shared/domain';
import { CourseUc } from '../uc/course.uc';
import { CourseMetadataListResponse } from './dto';
import { CourseMapper } from '../mapper/course.mapper';

@ApiTags('Teams')
@Authenticate('jwt')
@Controller('courses')
export class CourseController {
	constructor(private readonly courseUc: CourseUc) {}

	@Get()
	async findById(
		@Query() paginationQuery: PaginationQuery
	): Promise<CourseMetadataListResponse> {
		const [courses, total] = await this.courseUc.findAllByUser(currentUser.userId, paginationQuery);
		const courseResponses = courses.map((course) => CourseMapper.mapToMetadataResponse(course));
		const { skip, limit } = paginationQuery;

		const result = new CourseMetadataListResponse(courseResponses, total, skip, limit);
		return result;
	}
}
