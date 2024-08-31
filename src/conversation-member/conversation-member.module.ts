import { Module } from '@nestjs/common';
import { ConversationMemberService } from './conversation-member.service';
import { ConversationMemberController } from './conversation-member.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ConversationMember,
  ConversationMemberSchema,
} from './entities/conversation-member.entity';
import { UserModule } from 'src/user/user.module';
import { ConversationModule } from 'src/conversation/conversation.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ConversationMember.name,
        schema: ConversationMemberSchema,
        collection: 'conversation_members',
      },
    ]),
    UserModule,
    ConversationModule,
  ],
  controllers: [ConversationMemberController],
  providers: [ConversationMemberService],
})
export class ConversationMemberModule {}
