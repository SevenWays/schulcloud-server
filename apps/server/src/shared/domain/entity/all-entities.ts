import { ImportUser, UserMatch } from './import-user.entity';
import { Course } from './course.entity';
import { CourseGroup } from './coursegroup.entity';
import { DashboardGridElementModel, DashboardModelEntity } from './dashboard.model.entity';
import { BoardElement } from './boardelement.entity';
import { Board } from './board.entity';
import { BaseFile, Directory, File } from './file.entity';
import { Lesson } from './lesson.entity';
import { CourseNews, News, SchoolNews, TeamNews } from './news.entity';
import { Role } from './role.entity';
import { School } from './school.entity';
import { StorageProvider } from './storageprovider.entity';
import { Submission } from './submission.entity';
import { Task } from './task.entity';
import { Team } from './team.entity';
import { User } from './user.entity';
import { System } from './system.entity';

export const ALL_ENTITIES = [
	Course,
	CourseGroup,
	Board,
	BoardElement,
	DashboardModelEntity,
	DashboardGridElementModel,
	BaseFile,
	File,
	Directory,
	StorageProvider,
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
	System,
	// TODO move import user entities?
	ImportUser,
	UserMatch,
];
