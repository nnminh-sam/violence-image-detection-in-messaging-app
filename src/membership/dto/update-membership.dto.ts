import { IsEnum, IsOptional } from 'class-validator';
import { MembershipRole } from '../entities/membership-role.enum';
import { MembershipStatus } from '../entities/membership-status.enum';

export class UpdateMembershipDto {
  @IsOptional()
  @IsEnum(MembershipRole)
  role: MembershipRole;

  @IsOptional()
  @IsEnum(MembershipStatus)
  status: MembershipStatus;
}
