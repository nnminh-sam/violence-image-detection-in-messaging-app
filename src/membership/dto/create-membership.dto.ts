import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { MembershipRole } from '../entities/membership-role.enum';

export class CreateMembershipDto {
  @IsNotEmpty()
  @IsMongoId()
  user: string;

  @IsNotEmpty()
  @IsMongoId()
  conversation: string;

  @IsNotEmpty()
  @IsEnum(MembershipRole)
  role: MembershipRole;
}
