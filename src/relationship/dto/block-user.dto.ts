import { IsMongoId, IsNotEmpty } from 'class-validator';

export class BlockUserDto {
  @IsNotEmpty()
  @IsMongoId()
  blockedBy: string;

  @IsNotEmpty()
  @IsMongoId()
  targetUser: string;
}
