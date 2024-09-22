import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import {
  Conversation,
  ConversationSchema,
} from './entities/conversation.entity';
import { UserModule } from 'src/user/user.module';
import { MessagingModule } from 'src/messaging/messaging.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Conversation.name,
        schema: ConversationSchema,
        collection: 'conversations',
      },
    ]),
    UserModule,
    MessagingModule,
  ],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
