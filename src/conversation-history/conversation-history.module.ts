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

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ConversationHistory.name,
        schema: ConversationHistorySchema,
        collection: 'conversation-histories',
      },
    ]),
    UserModule,
    ConversationModule,
  ],
  controllers: [ConversationHistoryController],
  providers: [ConversationHistoryService],
})
export class ConversationHistoryModule {}
