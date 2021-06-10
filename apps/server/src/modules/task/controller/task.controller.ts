import { ApiTags } from '@nestjs/swagger';

import { PaginationResponse } from '@shared/controller/dto/pagination.response';
import { PaginationQuery } from '@shared/controller/dto/pagination.query';
import { Controller, Get, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { TaskUC } from '../uc/task.uc';

import { TaskResponse } from './dto';

// TODO: swagger doku do not read from combined query object only from passed single parameter in Query(), but this do not allowed optional querys only required querys

@ApiTags('Task')
@Authenticate('jwt')
@Controller('task')
export class TaskController {
	constructor(private readonly taskUc: TaskUC) {}

	@Get('dashboard')
	async findAll(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() paginationQuery: PaginationQuery
	): Promise<PaginationResponse<TaskResponse[]>> {
		// TODO map DTO to UC, UC publishes interfaces
		const [tasks, total] = await this.taskUc.findAllOpenForUser(currentUser.userId, paginationQuery);
		// TODO map to ResponseDTO
		const tasksResponse = tasks.map((task) => new TaskResponse(task));
		const { skip, limit } = paginationQuery;
		const result = new PaginationResponse(tasksResponse, total, skip, limit);
		return result;
	}
}
