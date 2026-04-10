import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

import { CatalogService } from './catalog.service.js';
import { UpsertCategoryDto } from './dto/category.dto.js';
import { UpsertProductDto } from './dto/product.dto.js';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  categories() {
    return this.catalog.categories();
  }

  @Get('home')
  homeContent() {
    return this.catalog.homeContent();
  }

  @ApiQuery({ name: 'category', required: false })
  @Get('products')
  products(@Query('category') category?: string) {
    return this.catalog.products(category);
  }

  @Get('products/:slug')
  productBySlug(@Param('slug') slug: string) {
    return this.catalog.productBySlug(slug);
  }

  @Get('admin/categories')
  adminCategories() {
    return this.catalog.adminCategories();
  }

  @ApiQuery({ name: 'categoryId', required: false })
  @Get('admin/products')
  adminProducts(@Query('categoryId') categoryId?: string) {
    return this.catalog.adminProducts(categoryId);
  }

  @Post('admin/categories')
  createCategory(@Body() body: UpsertCategoryDto) {
    return this.catalog.createCategory(body);
  }

  @Patch('admin/categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: UpsertCategoryDto) {
    return this.catalog.updateCategory(id, body);
  }

  @Delete('admin/categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.catalog.deleteCategory(id);
  }

  @Post('admin/products')
  createProduct(@Body() body: UpsertProductDto) {
    return this.catalog.createProduct(body);
  }

  @Patch('admin/products/:id')
  updateProduct(@Param('id') id: string, @Body() body: UpsertProductDto) {
    return this.catalog.updateProduct(id, body);
  }

  @Delete('admin/products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.catalog.deleteProduct(id);
  }
}
