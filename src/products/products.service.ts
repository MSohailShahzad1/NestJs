import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './product.interface';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
    private products: Product[] = [];
    private idCounter = 1;

    findAll(category?: string): Product[] {
        if (category) {
            return this.products.filter(
                (product) => product.category === category,
            );
        }
        return this.products;
    }

    findOne(id: number): Product {
        const product = this.products.find((p) => p.id === id);

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    create(dto: CreateProductDto): Product {
        const newProduct: Product = {
            id: this.idCounter++,
            ...dto,
        };

        this.products.push(newProduct);
        return newProduct;
    }

    update(id: number, dto: Partial<CreateProductDto>): Product {
        const product = this.findOne(id);

        Object.assign(product, dto);

        return product;
    }

    remove(id: number): void {
        const index = this.products.findIndex((p) => p.id === id);

        if (index === -1) {
            throw new NotFoundException('Product not found');
        }

        this.products.splice(index, 1);
    }
}