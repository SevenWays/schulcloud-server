import { Board, BoardProps } from '@shared/domain';
import { BaseFactory } from './base.factory';

export const boardFactory = BaseFactory.define<Board, BoardProps>(Board, ({ sequence }) => {
	return { name: `board #${sequence}`, references: [] };
});
