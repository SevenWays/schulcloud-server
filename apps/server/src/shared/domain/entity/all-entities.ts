import {
	DashboardModelEntity,
	DashboardGridElementModel,
	DefaultGridReferenceModel,
} from '@src/repositories/learnroom/dashboard.model.entity';
import { Course } from './course.entity';
import { CourseGroup } from './coursegroup.entity';
import { File } from './file.entity';
import { Lesson } from './lesson.entity';
import { News, CourseNews, SchoolNews, TeamNews } from './news.entity';
import { Role } from './role.entity';
import { School } from './school.entity';
import { Submission } from './submission.entity';
import { Task } from './task.entity';
import { Team } from './team.entity';
import { User } from './user.entity';

export const ALL_ENTITIES = [
	Course,
	CourseGroup,
	DashboardModelEntity,
	DashboardGridElementModel,
	DefaultGridReferenceModel,
	File,
	Lesson,
	Role,
	School,
	Submission,
	Task,
	Team,
	User,
	CourseNews,
	News,
	SchoolNews,
	TeamNews,
];