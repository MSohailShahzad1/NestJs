import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  create(@Body() body: CreatePostDto, @CurrentUser() user: { userId: number }) {
    return this.postsService.create(body, user.userId);
  }

  @Get()
  findAll(
    @Query('published') published?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('authorId') authorId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.postsService.findAll({
      published,
      categoryId,
      search,
      authorId,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  update(
    @Param('id') id: string,
    @Body() body: UpdatePostDto,
    @CurrentUser() user: { userId: number; role: string },
  ) {
    return this.postsService.update(+id, body, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'admin')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: number; role: string },
  ) {
    return this.postsService.remove(+id, user);
  }
}
