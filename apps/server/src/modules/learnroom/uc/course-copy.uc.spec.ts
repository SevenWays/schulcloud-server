import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
	Actions,
	BoardCopyService,
	CopyElementType,
	CopyHelperService,
	CopyStatusEnum,
	CourseCopyService,
	LessonCopyService,
	Permission,
} from '@shared/domain';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
import { BoardRepo, CourseRepo, UserRepo } from '@shared/repo';
import { boardFactory, courseFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { CourseCopyUC } from './course-copy.uc';
import { RoomsService } from './rooms.service';

describe('course copy uc', () => {
	let orm: MikroORM;
	let uc: CourseCopyUC;
	let courseRepo: DeepMocked<CourseRepo>;
	let boardRepo: DeepMocked<BoardRepo>;
	let authorisation: DeepMocked<AuthorizationService>;
	let courseCopyService: DeepMocked<CourseCopyService>;
	let boardCopyService: DeepMocked<BoardCopyService>;
	let roomsService: DeepMocked<RoomsService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let fileCopyAppendService: DeepMocked<FileCopyAppendService>;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				CourseCopyUC,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: BoardRepo,
					useValue: createMock<BoardRepo>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: CourseCopyService,
					useValue: createMock<CourseCopyService>(),
				},
				{
					provide: BoardCopyService,
					useValue: createMock<BoardCopyService>(),
				},
				{
					provide: RoomsService,
					useValue: createMock<RoomsService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: LessonCopyService,
					useValue: createMock<LessonCopyService>(),
				},
				{
					provide: FileCopyAppendService,
					useValue: createMock<FileCopyAppendService>(),
				},
			],
		}).compile();

		uc = module.get(CourseCopyUC);
		authorisation = module.get(AuthorizationService);
		courseRepo = module.get(CourseRepo);
		courseCopyService = module.get(CourseCopyService);
		boardRepo = module.get(BoardRepo);
		boardCopyService = module.get(BoardCopyService);
		roomsService = module.get(RoomsService);
		copyHelperService = module.get(CopyHelperService);
		lessonCopyService = module.get(LessonCopyService);
		fileCopyAppendService = module.get(FileCopyAppendService);
	});

	describe('copy course', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const allCourses = courseFactory.buildList(3, { teachers: [user] });
			const course = allCourses[0];
			const originalBoard = boardFactory.build({ course });
			const courseCopy = courseFactory.buildWithId({ teachers: [user] });
			const boardCopy = boardFactory.build({ course: courseCopy });

			authorisation.getUserWithPermissions.mockResolvedValue(user);
			courseRepo.findById.mockResolvedValue(course);
			courseRepo.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);
			boardRepo.findByCourseId.mockResolvedValue(originalBoard);
			authorisation.checkPermission.mockReturnValue();
			roomsService.updateBoard.mockResolvedValue(originalBoard);

			const courseCopyName = 'Copy';
			copyHelperService.deriveCopyName.mockReturnValue(courseCopyName);

			const boardCopyStatus = {
				title: 'boardCopy',
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: boardCopy,
			};
			boardCopyService.copyBoard.mockResolvedValue(boardCopyStatus);

			const status = {
				title: 'courseCopy',
				type: CopyElementType.COURSE,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: courseCopy,
			};

			const jwt = 'some-great-jwt';
			courseCopyService.copyCourse.mockReturnValue(status);

			fileCopyAppendService.appendFiles.mockResolvedValue(status);

			return {
				user,
				course,
				originalBoard,
				courseCopy,
				boardCopy,
				status,
				courseCopyName,
				allCourses,
				boardCopyStatus,
				jwt,
			};
		};

		it('should fetch correct user', async () => {
			const { course, user, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			expect(authorisation.getUserWithPermissions).toBeCalledWith(user.id);
		});

		it('should fetch original course', async () => {
			const { course, user, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			expect(courseRepo.findById).toBeCalledWith(course.id);
		});

		it('should fetch original board', async () => {
			const { course, user, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			expect(boardRepo.findByCourseId).toBeCalledWith(course.id);
		});

		it('should check authorisation for course', async () => {
			const { course, user, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			expect(authorisation.checkPermission).toBeCalledWith(user, course, {
				action: Actions.write,
				requiredPermissions: [Permission.COURSE_CREATE],
			});
		});

		it('should call course copy service', async () => {
			const { course, user, courseCopyName, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			expect(courseCopyService.copyCourse).toBeCalledWith({ originalCourse: course, user, copyName: courseCopyName });
		});

		it('should persist course copy', async () => {
			const { course, user, courseCopy, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			expect(courseRepo.save).toBeCalledWith(courseCopy);
		});

		it('should try to append file copies from original task to task copy', async () => {
			const { course, user, boardCopyStatus, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			expect(fileCopyAppendService.appendFiles).toBeCalledWith(boardCopyStatus, jwt);
		});

		it('should call board copy service', async () => {
			const { course, courseCopy, originalBoard, user, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			expect(boardCopyService.copyBoard).toBeCalledWith({ originalBoard, destinationCourse: courseCopy, user });
		});

		it('should persist board copy', async () => {
			const { course, user, boardCopy, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			expect(boardRepo.save).toBeCalledWith(boardCopy);
		});

		it('should return status', async () => {
			const { course, user, status, jwt } = setup();
			const result = await uc.copyCourse(user.id, course.id, jwt);
			expect(result).toEqual(status);
		});

		it('should ensure course has uptodate board', async () => {
			const { course, user, originalBoard, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			expect(roomsService.updateBoard).toHaveBeenCalledWith(originalBoard, course.id, user.id);
		});

		it('should use copyHelperService', async () => {
			const { course, user, allCourses, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			const allCourseNames = allCourses.map((c) => c.name);
			expect(copyHelperService.deriveCopyName).toHaveBeenCalledWith(course.name, allCourseNames);
		});

		it('should use lessonCopyService.updateCopiedEmbeddedTasks', async () => {
			const { course, user, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			expect(lessonCopyService.updateCopiedEmbeddedTasks).toHaveBeenCalled();
		});

		it('should use findAllByUserId to determine existing course names', async () => {
			const { course, user, jwt } = setup();
			await uc.copyCourse(user.id, course.id, jwt);
			expect(courseRepo.findAllByUserId).toHaveBeenCalledWith(user.id);
		});

		describe('when access to course is forbidden', () => {
			const setupWithCourseForbidden = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				courseRepo.findById.mockResolvedValue(course);
				authorisation.checkPermission.mockImplementation(() => {
					throw new ForbiddenException();
				});
				const jwt = 'some-jwt-token';
				return { user, course, jwt };
			};

			it('should throw ForbiddenException', async () => {
				const { course, user, jwt } = setupWithCourseForbidden();

				try {
					await uc.copyCourse(user.id, course.id, jwt);
					throw new Error('should have failed');
				} catch (err) {
					expect(err).toBeInstanceOf(ForbiddenException);
				}
			});
		});
	});
});
