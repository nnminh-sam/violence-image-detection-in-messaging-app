import { IsEnum, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
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

  @IsOptional()
  @IsMongoId()
  partner?: string;
}
