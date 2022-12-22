import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	CustomParameterLocationParams,
	CustomParameterScopeParams,
	CustomParameterTypeParams,
} from '../../../interface';

export class CustomParameterResponse {
	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	default?: string;

	@ApiPropertyOptional()
	regex?: string;

	@ApiPropertyOptional()
	regexComment?: string;

	@ApiProperty()
	scope: CustomParameterScopeParams;

	@ApiProperty()
	location: CustomParameterLocationParams;

	@ApiProperty()
	type: CustomParameterTypeParams;

	@ApiProperty()
	isOptional: boolean;

	constructor(props: CustomParameterResponse) {
		this.name = props.name;
		this.default = props.default;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
		this.regexComment = props.regexComment;
		this.isOptional = props.isOptional;
	}
}