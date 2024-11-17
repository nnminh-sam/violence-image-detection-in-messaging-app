import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { ConversationModule } from './conversation/conversation.module';
import { RelationshipModule } from './relationship/relationship.module';
import { MembershipModule } from './membership/membership.module';
import { MessageModule } from './message/message.module';
import { AuthModule } from './auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventModule } from './event/event.module';
import { MediaModule } from './media/media.module';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const envVar = process.env;
const DATABASE_CONNECTION_STRING: string =
  envVar.MODE === 'prod'
    ? `${envVar.DATABASE_CONNECTION_STRING_PROD}`
    : `${envVar.DATABASE_CONNECTION_STRING_DEV}`;

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
    MembershipModule,
    MessageModule,
    AuthModule,
    EventModule,
    MediaModule,
  ],
  controllers: [],
})
export class AppModule {
  constructor() {
    console.log(`Connecting to ${envVar.MODE} database`);
    if (envVar.DATABASE_DEBUG_MODE === 'true') {
      mongoose.set('debug', true);
    }
  }
}
