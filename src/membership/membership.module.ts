import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Membership, MembershipSchema } from './entities/membership.entity';
import { UserModule } from 'src/user/user.module';
import { ConversationModule } from 'src/conversation/conversation.module';
import { MembershipValidationListener } from './listener/membership-validation.listener';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Membership.name,
        schema: MembershipSchema,
        collection: 'conversation_members',
      },
    ]),
    UserModule,
    ConversationModule,
  ],
  controllers: [MembershipController],
  providers: [MembershipService, MembershipValidationListener],
})
export class MembershipModule {}
