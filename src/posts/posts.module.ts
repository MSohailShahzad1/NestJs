import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Category } from '../categories/entities/category.entity';
import { CategoriesModule } from '../categories/categories.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [CategoriesModule, TypeOrmModule.forFeature([Post, Category, User])],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
