import { BoardDataMapperSimple } from './simple/board.datamapper';
import { BoardDataMapperSerialize } from './serialized/board.datamapper';
import { BoardDataMapperInterfaced } from './interfaced/board.datamapper';

export const ALL_DATAMAPPERS = [BoardDataMapperSimple, BoardDataMapperSerialize, BoardDataMapperInterfaced];
