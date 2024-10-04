import { ConversationModule } from 'src/conversation/conversation.module';
import { Module } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { RelationshipController } from './relationship.controller';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Relationship,
  RelationshipSchema,
} from './entities/relationship.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Relationship.name,
        schema: RelationshipSchema,
        collection: 'relationships',
      },
    ]),
    UserModule,
    ConversationModule,
  ],
  controllers: [RelationshipController],
  providers: [RelationshipService],
})
export class RelationshipModule {}
