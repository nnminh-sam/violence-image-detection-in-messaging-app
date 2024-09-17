import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConversationModule } from './conversation/conversation.module';
import { RelationshipModule } from './relationship/relationship.module';
import { ConversationMemberModule } from './conversation-member/conversation-member.module';
import { ConversationHistoryModule } from './conversation-history/conversation-history.module';
import { AuthModule } from './auth/auth.module';

import * as dotenv from 'dotenv';
import { EventEmitterModule } from '@nestjs/event-emitter';

dotenv.config();

const envVar = process.env;
const DATABASE_CONNECTION_STRING = `mongodb://${envVar.DATABASE_HOST}:${envVar.DATABASE_PORT}/${envVar.DATABASE_NAME}`;

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // * the delimiter used to segment namespaces
      delimiter: '.',
      // * set this to `true` if you want to emit the newListener event
      newListener: false,
      // * set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // * the maximum amount of listeners that can be assigned to an event
      maxListeners: 10,
      // * show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
    }),
    MongooseModule.forRoot(DATABASE_CONNECTION_STRING),
    UserModule,
    ConversationModule,
    RelationshipModule,
    ConversationMemberModule,
    ConversationHistoryModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
