import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../common/prisma.service.js';
import { UpsertCategoryDto } from './dto/category.dto.js';
import { ProductMetadataDto, ProductPricingRuleDto, ProductVariantDto, UpsertProductDto } from './dto/product.dto.js';

function sanitizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function sanitizeStringArray(values?: string[]) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function buildProductMetadata(metadata?: ProductMetadataDto) {
  const normalized = {
    imageUrl: sanitizeText(metadata?.imageUrl),
    marketingTitle: sanitizeText(metadata?.marketingTitle),
    marketingDescription: sanitizeText(metadata?.marketingDescription),
    heroCopy: sanitizeText(metadata?.heroCopy),
    proofPoints: sanitizeStringArray(metadata?.proofPoints),
  };

  const hasContent = Object.values(normalized).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  );

  return hasContent ? (normalized as Prisma.InputJsonValue) : Prisma.JsonNull;
}

function normalizeVariants(variants: ProductVariantDto[]) {
  const cleaned = variants.map((variant, index) => ({
    ...variant,
    sku: variant.sku.trim(),
    name: variant.name.trim(),
    color: sanitizeText(variant.color),
    size: sanitizeText(variant.size),
    stock: Number(variant.stock ?? 0),
    isDefault: Boolean(variant.isDefault),
    _originalIndex: index,
  }));

  const hasExplicitDefault = cleaned.some((variant) => variant.isDefault);

  return cleaned.map((variant, index) => ({
    ...variant,
    isDefault: hasExplicitDefault ? variant.isDefault : index === 0,
  }));
}

function normalizePricingRules(rules: ProductPricingRuleDto[]) {
  return rules.map((rule) => ({
    ...rule,
    minQuantity: rule.minQuantity ?? null,
    maxQuantity: rule.maxQuantity ?? null,
    baseUnitPrice: rule.baseUnitPrice ?? null,
    estimatedUnitCost: rule.estimatedUnitCost ?? null,
    pricePerSquareMeter: rule.pricePerSquareMeter ?? null,
    estimatedCostPerSquareMeter: rule.estimatedCostPerSquareMeter ?? null,
    personalizationMultiplier: rule.personalizationMultiplier ?? null,
    setupFee: rule.setupFee ?? null,
    active: rule.active ?? true,
  }));
}

const adminCategoryInclude = {
  _count: { select: { products: true } },
} satisfies Prisma.ProductCategoryInclude;

const adminProductInclude = {
  category: { select: { id: true, name: true, slug: true } },
  pricingRules: { orderBy: [{ active: 'desc' }, { minQuantity: 'asc' }, { createdAt: 'asc' }] },
  variants: { orderBy: [{ isDefault: 'desc' }, { name: 'asc' }] },
  _count: { select: { orderItems: true, designSessions: true, artworks: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  categories() {
    return this.prisma.productCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: { where: { active: true } } } },
      },
    });
  }

  products(categorySlug?: string) {
    return this.prisma.product.findMany({
      where: {
        active: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
      include: {
        category: { select: { name: true, slug: true } },
        pricingRules: { where: { active: true }, take: 1 },
        variants: { where: { stock: { gt: 0 } }, take: 5 },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async homeContent() {
    const [categories, featuredProducts] = await Promise.all([
      this.prisma.productCategory.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          _count: { select: { products: { where: { active: true } } } },
        },
      }),
      this.prisma.product.findMany({
        where: {
          active: true,
          featured: true,
        },
        include: {
          category: { select: { name: true, slug: true } },
          pricingRules: { where: { active: true }, take: 1 },
          variants: { where: { stock: { gt: 0 } }, take: 5 },
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        take: 6,
      }),
    ]);

    return {
      categories: categories.filter((category) => category._count.products > 0),
      featuredProducts,
    };
  }

  async productBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        pricingRules: { where: { active: true } },
        variants: true,
        designTemplates: { where: { isActive: true }, take: 6 },
      },
    });
    if (!product) throw new NotFoundException(`Producto '${slug}' no encontrado`);
    return product;
  }

  adminCategories() {
    return this.prisma.productCategory.findMany({
      include: adminCategoryInclude,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  adminProducts(categoryId?: string) {
    return this.prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: adminProductInclude,
      orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }, { name: 'asc' }],
    });
  }

  async createCategory(dto: UpsertCategoryDto) {
    const created = await this.prisma.productCategory.create({
      data: {
        name: dto.name.trim(),
        slug: dto.slug.trim(),
        description: sanitizeText(dto.description),
        imageUrl: sanitizeText(dto.imageUrl),
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      },
    });

    return this.adminCategoryById(created.id);
  }

  async updateCategory(id: string, dto: UpsertCategoryDto) {
    await this.ensureCategoryExists(id);

    await this.prisma.productCategory.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        slug: dto.slug.trim(),
        description: sanitizeText(dto.description),
        imageUrl: sanitizeText(dto.imageUrl),
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      },
    });

    return this.adminCategoryById(id);
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`Categoria ${id} no encontrada`);
    }

    if (existing._count.products > 0) {
      const archived = await this.prisma.productCategory.update({
        where: { id },
        data: { active: false },
        include: adminCategoryInclude,
      });

      return {
        status: 'archived',
        message: 'La categoria tenia productos asociados y fue archivada en lugar de eliminarse.',
        category: archived,
      };
    }

    await this.prisma.productCategory.delete({ where: { id } });
    return {
      status: 'deleted',
      message: 'Categoria eliminada correctamente.',
    };
  }

  async createProduct(dto: UpsertProductDto) {
    await this.ensureCategoryExists(dto.categoryId);

    const created = await this.prisma.product.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        slug: dto.slug.trim(),
        description: dto.description.trim(),
        sku: dto.sku.trim(),
        pricingModel: dto.pricingModel,
        baseColorOptions: sanitizeStringArray(dto.baseColorOptions),
        printableSurfaces: sanitizeStringArray(dto.printableSurfaces),
        metadata: buildProductMetadata(dto.metadata),
        active: dto.active ?? true,
        featured: dto.featured ?? false,
        variants: {
          create: normalizeVariants(dto.variants).map((variant) => ({
            sku: variant.sku,
            name: variant.name,
            color: variant.color,
            size: variant.size,
            stock: variant.stock,
            isDefault: variant.isDefault,
          })),
        },
        pricingRules: {
          create: normalizePricingRules(dto.pricingRules).map((rule) => ({
            pricingModel: rule.pricingModel,
            minQuantity: rule.minQuantity,
            maxQuantity: rule.maxQuantity,
            baseUnitPrice: rule.baseUnitPrice,
            estimatedUnitCost: rule.estimatedUnitCost,
            pricePerSquareMeter: rule.pricePerSquareMeter,
            estimatedCostPerSquareMeter: rule.estimatedCostPerSquareMeter,
            personalizationMultiplier: rule.personalizationMultiplier,
            setupFee: rule.setupFee,
            active: rule.active,
          })),
        },
      },
    });

    return this.adminProductById(created.id);
  }

  async updateProduct(id: string, dto: UpsertProductDto) {
    await this.ensureProductExists(id);
    await this.ensureCategoryExists(dto.categoryId);

    await this.prisma.product.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        slug: dto.slug.trim(),
        description: dto.description.trim(),
        sku: dto.sku.trim(),
        pricingModel: dto.pricingModel,
        baseColorOptions: sanitizeStringArray(dto.baseColorOptions),
        printableSurfaces: sanitizeStringArray(dto.printableSurfaces),
        metadata: buildProductMetadata(dto.metadata),
        active: dto.active ?? true,
        featured: dto.featured ?? false,
      },
    });

    await this.syncVariants(id, dto.variants);
    await this.syncPricingRules(id, dto.pricingRules);

    return this.adminProductById(id);
  }

  async deleteProduct(id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true, designSessions: true, artworks: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`Producto ${id} no encontrado`);
    }

    if (existing._count.orderItems > 0 || existing._count.designSessions > 0 || existing._count.artworks > 0) {
      const archived = await this.prisma.product.update({
        where: { id },
        data: {
          active: false,
          featured: false,
        },
        include: adminProductInclude,
      });

      return {
        status: 'archived',
        message:
          'El producto ya esta ligado a operaciones reales y fue archivado para no romper historial.',
        product: archived,
      };
    }

    await this.prisma.product.delete({ where: { id } });
    return {
      status: 'deleted',
      message: 'Producto eliminado correctamente.',
    };
  }

  private async syncVariants(productId: string, incomingVariants: ProductVariantDto[]) {
    const existingVariants = await this.prisma.productVariant.findMany({
      where: { productId },
      include: { _count: { select: { orderItems: true } } },
    });

    const normalizedIncoming = normalizeVariants(incomingVariants);
    const handledIds = new Set<string>();

    for (const variant of normalizedIncoming) {
      const existing =
        (variant.id ? existingVariants.find((item) => item.id === variant.id) : undefined) ??
        existingVariants.find((item) => item.sku === variant.sku);

      const data = {
        sku: variant.sku,
        name: variant.name,
        color: variant.color,
        size: variant.size,
        stock: variant.stock,
        isDefault: variant.isDefault,
        metadata: Prisma.JsonNull,
      };

      if (existing) {
        handledIds.add(existing.id);
        await this.prisma.productVariant.update({
          where: { id: existing.id },
          data,
        });
        continue;
      }

      await this.prisma.productVariant.create({
        data: {
          productId,
          ...data,
        },
      });
    }

    const staleVariants = existingVariants.filter((item) => !handledIds.has(item.id));

    for (const stale of staleVariants) {
      if (stale._count.orderItems > 0) {
        throw new BadRequestException(
          `La variante ${stale.name} (${stale.sku}) ya tiene ordenes asociadas. Editala o dejala con stock 0 en lugar de removerla.`,
        );
      }

      await this.prisma.productVariant.delete({
        where: { id: stale.id },
      });
    }
  }

  private async syncPricingRules(productId: string, incomingRules: ProductPricingRuleDto[]) {
    const existingRules = await this.prisma.productPricingRule.findMany({
      where: { productId },
    });

    const normalizedIncoming = normalizePricingRules(incomingRules);
    const handledIds = new Set<string>();

    for (const rule of normalizedIncoming) {
      const existing =
        (rule.id ? existingRules.find((item) => item.id === rule.id) : undefined) ?? null;

      const data = {
        pricingModel: rule.pricingModel,
        minQuantity: rule.minQuantity,
        maxQuantity: rule.maxQuantity,
        baseUnitPrice: rule.baseUnitPrice,
        estimatedUnitCost: rule.estimatedUnitCost,
        pricePerSquareMeter: rule.pricePerSquareMeter,
        estimatedCostPerSquareMeter: rule.estimatedCostPerSquareMeter,
        personalizationMultiplier: rule.personalizationMultiplier,
        setupFee: rule.setupFee,
        active: rule.active,
      };

      if (existing) {
        handledIds.add(existing.id);
        await this.prisma.productPricingRule.update({
          where: { id: existing.id },
          data,
        });
        continue;
      }

      await this.prisma.productPricingRule.create({
        data: {
          productId,
          ...data,
        },
      });
    }

    const staleRules = existingRules.filter((item) => !handledIds.has(item.id));

    if (staleRules.length) {
      await this.prisma.productPricingRule.deleteMany({
        where: {
          id: {
            in: staleRules.map((item) => item.id),
          },
        },
      });
    }
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Categoria ${categoryId} no encontrada`);
    }
  }

  private async ensureProductExists(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto ${productId} no encontrado`);
    }
  }

  private async adminCategoryById(id: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: adminCategoryInclude,
    });

    if (!category) {
      throw new NotFoundException(`Categoria ${id} no encontrada`);
    }

    return category;
  }

  private async adminProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: adminProductInclude,
    });

    if (!product) {
      throw new NotFoundException(`Producto ${id} no encontrado`);
    }

    return product;
  }
}
