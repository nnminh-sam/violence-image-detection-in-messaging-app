import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import RelationshipStatus from '../entities/relationship.enum';

export class CreateRelationshipDto {
  @IsNotEmpty({
    message: 'User A ID is not empty',
  })
  @IsMongoId()
  userA: string;

  @IsNotEmpty({
    message: 'User B ID is not empty',
  })
  @IsMongoId()
  userB: string;
}
