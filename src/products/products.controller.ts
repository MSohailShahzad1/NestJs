import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    // GET /products?category=electronics
    @Get()
    getAll(@Query('category') category?: string) {
        return this.productsService.findAll(category);
    }

    // GET /products/:id
    @Get(':id')
    getOne(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.findOne(id);
    }

    // POST /products
    @Post()
    @HttpCode(HttpStatus.CREATED) // 201
    create(@Body() dto: CreateProductDto) {
        return this.productsService.create(dto);
    }

    // PATCH /products/:id
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: Partial<CreateProductDto>,
    ) {
        return this.productsService.update(id, dto);
    }

    // DELETE /products/:id
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) // 204
    remove(@Param('id', ParseIntPipe) id: number) {
        this.productsService.remove(id);
    }
}