import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { ConversationModule } from './conversation/conversation.module';
import { RelationshipModule } from './relationship/relationship.module';
import { ConversationMemberModule } from './conversation-member/conversation-member.module';
import { ConversationHistoryModule } from './conversation-history/conversation-history.module';
import { AuthModule } from './auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MessagingModule } from './messaging/messaging.module';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const envVar = process.env;
const DATABASE_CONNECTION_STRING = `mongodb://${envVar.DATABASE_HOST}:${envVar.DATABASE_PORT}/${envVar.DATABASE_NAME}`;

@Module({
  imports: [
    EventEmitterModule.forRoot({
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
    }),
    MongooseModule.forRoot(DATABASE_CONNECTION_STRING),
    UserModule,
    ConversationModule,
    RelationshipModule,
    ConversationMemberModule,
    ConversationHistoryModule,
    AuthModule,
    MessagingModule,
  ],
  controllers: [],
})
export class AppModule {
  constructor() {
    if (envVar.DATABASE_DEBUG_MODE === 'true') {
      mongoose.set('debug', true);
    }
  }
}
