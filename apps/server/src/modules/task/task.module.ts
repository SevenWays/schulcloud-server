import { Module } from '@nestjs/common';
import { CourseRepo, LessonRepo, TaskRepo, UserRepo } from '@shared/repo';
import { AuthorizationModule } from '../authorization';
import { TaskController } from './controller/task.controller';
import { TaskUC } from './uc';

@Module({
	imports: [AuthorizationModule],
	controllers: [TaskController],
	providers: [TaskUC, TaskRepo, LessonRepo, CourseRepo, UserRepo],
})
export class TaskModule {}
