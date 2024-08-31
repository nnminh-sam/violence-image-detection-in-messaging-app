import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConversationModule } from './conversation/conversation.module';
import { RelationshipModule } from './relationship/relationship.module';
import { ConversationMemberModule } from './conversation-member/conversation-member.module';

import * as dotenv from 'dotenv';

dotenv.config();

const envVar = process.env;
const DATABASE_CONNECTION_STRING = `mongodb://${envVar.DATABASE_HOST}:${envVar.DATABASE_PORT}/${envVar.DATABASE_NAME}`;

@Module({
  imports: [MongooseModule.forRoot(DATABASE_CONNECTION_STRING), UserModule, ConversationModule, RelationshipModule, ConversationMemberModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
