import { State as BaseState } from '@sierralabs/nest-identity';
import { Entity } from 'typeorm';

/**
 * US and Territory State names, abbreviations, and meta data from https://statetable.com/
 */
@Entity()
export class State extends BaseState {}
