import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Category } from '../categories/entities/category.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../users/entities/user.entity';

type PostFilters = {
  published?: string;
  categoryId?: string;
  search?: string;
  authorId?: string;
  sortBy?: string;
  sortOrder?: string;
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
    const { published, categoryId, search, authorId, sortBy, sortOrder } = query;

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.author', 'author');

    if (published !== undefined) {
      qb.andWhere('post.published = :published', {
        published: published === 'true',
      });
    }

    if (categoryId !== undefined) {
      const parsedCategoryId = Number(categoryId);

      if (!Number.isNaN(parsedCategoryId)) {
        qb.andWhere('category.id = :categoryId', {
          categoryId: parsedCategoryId,
        });
      }
    }

    if (authorId !== undefined) {
      const parsedAuthorId = Number(authorId);

      if (!Number.isNaN(parsedAuthorId)) {
        qb.andWhere('author.id = :authorId', { authorId: parsedAuthorId });
      }
    }

    if (search) {
      qb.andWhere('(post.title LIKE :search OR post.content LIKE :search)', {
        search: `%${search}%`,
      });
    }

    const sortableFields: Record<string, string> = {
      createdAt: 'post.createdAt',
      title: 'post.title',
    };

    const sortField = sortableFields[sortBy ?? 'createdAt'] ?? 'post.createdAt';
    const normalizedSortOrder = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(sortField, normalizedSortOrder);

    return qb.getMany();
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
