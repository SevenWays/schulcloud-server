import { ApiProperty } from '@nestjs/swagger';
import { JwtPayload } from '../../../modules/authentication/interfaces/jwt-payload';

export class JwtUserEntity {
	constructor(payload: JwtPayload) {
		// TODO Builder
		this.userId = payload.userId;
		this.schoolId = payload.schoolId;
		this.roles = payload.roles;
	}
	@ApiProperty()
	userId: string;
	@ApiProperty()
	schoolId: string;
	@ApiProperty()
	roles: string[];
}
