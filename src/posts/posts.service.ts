import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Category } from '../categories/entities/category.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../users/entities/user.entity';

type PostFilters = {
  published?: string;
  categoryId?: string;
};

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepo: Repository<Post>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(dto: CreatePostDto, userId: number) {
    const category = await this.categoryRepo.findOneBy({
      id: dto.categoryId,
    });
    const author = await this.userRepo.findOneBy({ id: userId });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!author) {
      throw new NotFoundException('User not found');
    }

    const post = this.postRepo.create({
      ...dto,
      category,
      author,
    });

    return this.postRepo.save(post);
  }

  async findAll(query: PostFilters) {
    const { published, categoryId } = query;

    const where: FindOptionsWhere<Post> = {};

    if (published !== undefined) {
      where.published = published === 'true';
    }

    if (categoryId !== undefined) {
      const parsedCategoryId = Number(categoryId);

      if (!Number.isNaN(parsedCategoryId)) {
        where.category = { id: parsedCategoryId };
      }
    }

    return this.postRepo.find({ where });
  }

  async findOne(id: number) {
    const post = await this.postRepo.findOneBy({ id });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async update(
    id: number,
    dto: UpdatePostDto,
    currentUser: { userId: number; role: string },
  ) {
    const post = await this.findOneWithAuthor(id);
    this.assertCanManagePost(post, currentUser);

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOneBy({
        id: dto.categoryId,
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      post.category = category;
    }

    Object.assign(post, dto);
    return this.postRepo.save(post);
  }

  async remove(id: number, currentUser: { userId: number; role: string }) {
    const post = await this.findOneWithAuthor(id);
    this.assertCanManagePost(post, currentUser);
    return this.postRepo.remove(post);
  }

  private async findOneWithAuthor(id: number) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  private assertCanManagePost(
    post: Post,
    currentUser: { userId: number; role: string },
  ) {
    if (currentUser.role === 'admin') {
      return;
    }

    // Some legacy rows may not have an author; only admins can manage them.
    if (!post.author || post.author.id !== currentUser.userId) {
      throw new ForbiddenException('You can only modify your own posts');
    }
  }
}
