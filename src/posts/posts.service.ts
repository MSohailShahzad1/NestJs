import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Category } from '../categories/entities/category.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

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
  ) {}

  async create(dto: CreatePostDto) {
    const category = await this.categoryRepo.findOneBy({
      id: dto.categoryId,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const post = this.postRepo.create({
      ...dto,
      category,
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

  async update(id: number, dto: UpdatePostDto) {
    const post = await this.findOne(id);

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

  async remove(id: number) {
    const post = await this.findOne(id);
    return this.postRepo.remove(post);
  }
}
