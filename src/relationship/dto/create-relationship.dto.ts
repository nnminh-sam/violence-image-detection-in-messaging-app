import { OmitType } from '@nestjs/mapped-types';
import { Relationship } from '../entities/relationship.entity';

export class CreateRelationshipDto extends OmitType(Relationship, [
  'createdAt',
  'updatedAt',
  'deletedAt',
]) {}
