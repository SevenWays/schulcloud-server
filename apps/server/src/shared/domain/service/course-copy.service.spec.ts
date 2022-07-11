import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardCopyService, CopyHelperService, CourseCopyService } from '@shared/domain';
import { boardFactory, courseFactory, schoolFactory, setupEntities, userFactory } from '../../testing';
import { Course } from '../entity';
import { CopyElementType, CopyStatusEnum } from '../types';

describe('course copy service', () => {
	let module: TestingModule;
	let copyService: CourseCopyService;
	let boardCopyService: DeepMocked<BoardCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;

	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseCopyService,
				{
					provide: BoardCopyService,
					useValue: createMock<BoardCopyService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
			],
		}).compile();

		copyService = module.get(CourseCopyService);
		boardCopyService = module.get(BoardCopyService);
		copyHelperService = module.get(CopyHelperService);
	});

	describe('handleCopyCourse', () => {
		describe('when course is empty', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build();

				const boardCopy = boardFactory.build();
				const boardCopyStatus = {
					title: 'board',
					type: CopyElementType.BOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: boardCopy,
				};
				const courseCopyName = 'Copy';
				boardCopyService.copyBoard.mockReturnValue(boardCopyStatus);
				copyHelperService.deriveCopyName.mockReturnValue(courseCopyName);
				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.PARTIAL);

				return { user, originalCourse, boardCopyStatus, courseCopyName };
			};

			it('should assign user as teacher', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				expect((status.copyEntity as Course).teachers.contains(user)).toEqual(true);
			});

			it('should set school of user', () => {
				const { originalCourse } = setup();

				const destinationSchool = schoolFactory.buildWithId();
				const user = userFactory.build({ school: destinationSchool });

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(course.school).toEqual(destinationSchool);
			});

			it('should use copyHelperService', () => {
				const { originalCourse, user } = setup();

				copyService.copyCourse({
					originalCourse,
					user,
				});

				expect(copyHelperService.deriveCopyName).toHaveBeenCalledWith(originalCourse.name);
			});

			it('should set name of copy', () => {
				const { originalCourse, user, courseCopyName } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(course.name).toEqual(courseCopyName);
			});

			it('should set start date of course', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(user.school.schoolYear).toBeDefined();
				expect(course.startDate).toEqual(user.school.schoolYear?.startDate);
			});

			it('should set end date of course', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(user.school.schoolYear).toBeDefined();
				expect(course.untilDate).toEqual(user.school.schoolYear?.endDate);
			});

			it('should set color of course', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(course.color).toEqual(originalCourse.color);
			});

			it('should set status type to course', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				expect(status.type).toEqual(CopyElementType.COURSE);
			});

			it('should set status to partial', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				expect(status.status).toEqual(CopyStatusEnum.PARTIAL);
			});

			it('should set status title to title of the copy', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				expect(status.title).toEqual((status.copyEntity as Course).name);
			});

			it('should set status of metadata', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const metadataStatus = status.elements?.find((el) => el.type === CopyElementType.METADATA);
				expect(metadataStatus).toBeDefined();
				expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should set status of users', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const teachersStatus = status.elements?.find((el) => el.type === CopyElementType.USER_GROUP);
				expect(teachersStatus).toBeDefined();
				expect(teachersStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of ltiTools', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const ltiToolsStatus = status.elements?.find((el) => el.type === CopyElementType.LTITOOL_GROUP);
				expect(ltiToolsStatus).toBeDefined();
				expect(ltiToolsStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of times', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const timesStatus = status.elements?.find((el) => el.type === CopyElementType.TIME_GROUP);
				expect(timesStatus).toBeDefined();
				expect(timesStatus?.status).toEqual(CopyStatusEnum.NOT_DOING);
			});

			it('should set status of files', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const fileGroup = status.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
				expect(fileGroup).toBeDefined();
				expect(fileGroup?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});

			it('should set status of coursegroups', () => {
				const { originalCourse, user } = setup();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const coursegroupsStatus = status.elements?.find((el) => el.type === CopyElementType.COURSEGROUP_GROUP);
				expect(coursegroupsStatus).toBeDefined();
				expect(coursegroupsStatus?.status).toEqual(CopyStatusEnum.NOT_IMPLEMENTED);
			});

			it('should call copyHelperService', () => {
				const { originalCourse, user } = setup();

				copyService.copyCourse({
					originalCourse,
					user,
				});
				expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalled();
			});
		});

		describe('when course contains additional users', () => {
			const setupWithAdditionalUsers = () => {
				const user = userFactory.build();
				const teachers = userFactory.buildList(1);

				const substitutionTeachers = userFactory.buildList(1);
				const students = userFactory.buildList(1);

				const originalCourse = courseFactory.build({ teachers: [user, ...teachers], substitutionTeachers, students });
				const originalBoard = boardFactory.build({ course: originalCourse });

				return { user, originalBoard, originalCourse };
			};

			it('should not set any students in the copy', () => {
				const { originalCourse, user } = setupWithAdditionalUsers();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				expect(status.copyEntity).toBeDefined();
				const course = status.copyEntity as Course;
				expect(course.students.length).toEqual(0);
			});

			it('should not set any additional teachers', () => {
				const { originalCourse, user } = setupWithAdditionalUsers();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(course.teachers.length).toEqual(1);
			});

			it('should not set any substitution Teachers in the copy', () => {
				const { originalCourse, user } = setupWithAdditionalUsers();

				const status = copyService.copyCourse({
					originalCourse,
					user,
				});

				const course = status.copyEntity as Course;
				expect(course.substitutionTeachers.length).toEqual(0);
			});
		});
	});
});
