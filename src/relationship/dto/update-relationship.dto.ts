import { IsEnum } from 'class-validator';
import RelationshipStatus from '../entities/relationship.enum';

export class UpdateRelationshipDto {
  @IsEnum(RelationshipStatus)
  status: RelationshipStatus;
}
