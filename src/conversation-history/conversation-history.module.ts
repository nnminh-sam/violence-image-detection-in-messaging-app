import { Module } from '@nestjs/common';
import { ConversationHistoryService } from './conversation-history.service';
import { ConversationHistoryController } from './conversation-history.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ConversationHistory,
  ConversationHistorySchema,
} from './entities/conversation-history.entity';
import { ConversationModule } from 'src/conversation/conversation.module';
import { UserModule } from 'src/user/user.module';
import { MessagingModule } from 'src/messaging/messaging.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ConversationHistory.name,
        schema: ConversationHistorySchema,
        collection: 'conversation_histories',
      },
    ]),
    UserModule,
    ConversationModule,
    MessagingModule,
  ],
  controllers: [ConversationHistoryController],
  providers: [ConversationHistoryService],
})
export class ConversationHistoryModule {}
