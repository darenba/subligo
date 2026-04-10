'use client';

import { ChangeEvent, startTransition, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  CatalogAdminCategory,
  CatalogAdminProduct,
} from '../../lib/backoffice';
import { extractClientApiError, requestClientApi } from '../../lib/client-api';

type CategoryFormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
  active: boolean;
};

type ProductVariantFormState = {
  id?: string;
  sku: string;
  name: string;
  color: string;
  size: string;
  stock: string;
  isDefault: boolean;
};

type ProductPricingRuleFormState = {
  id?: string;
  pricingModel: 'UNIT' | 'AREA';
  minQuantity: string;
  maxQuantity: string;
  baseUnitPrice: string;
  estimatedUnitCost: string;
  pricePerSquareMeter: string;
  estimatedCostPerSquareMeter: string;
  personalizationMultiplier: string;
  setupFee: string;
  active: boolean;
};

type ProductFormState = {
  id?: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  pricingModel: 'UNIT' | 'AREA';
  featured: boolean;
  active: boolean;
  imageUrl: string;
  marketingTitle: string;
  marketingDescription: string;
  heroCopy: string;
  proofPoints: string;
  baseColorOptions: string;
  printableSurfaces: string;
  variants: ProductVariantFormState[];
  pricingRules: ProductPricingRuleFormState[];
};

function createEmptyCategoryForm(): CategoryFormState {
  return {
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    sortOrder: '0',
    active: true,
  };
}

function createEmptyVariantForm(): ProductVariantFormState {
  return {
    sku: '',
    name: '',
    color: '',
    size: '',
    stock: '0',
    isDefault: false,
  };
}

function createEmptyPricingRuleForm(
  pricingModel: 'UNIT' | 'AREA' = 'UNIT',
): ProductPricingRuleFormState {
  return {
    pricingModel,
    minQuantity: '1',
    maxQuantity: '',
    baseUnitPrice: '',
    estimatedUnitCost: '',
    pricePerSquareMeter: '',
    estimatedCostPerSquareMeter: '',
    personalizationMultiplier: '1',
    setupFee: '',
    active: true,
  };
}

function createEmptyProductForm(categoryId?: string): ProductFormState {
  return {
    categoryId: categoryId ?? '',
    name: '',
    slug: '',
    description: '',
    sku: '',
    pricingModel: 'UNIT',
    featured: false,
    active: true,
    imageUrl: '',
    marketingTitle: '',
    marketingDescription: '',
    heroCopy: '',
    proofPoints: '',
    baseColorOptions: '',
    printableSurfaces: '',
    variants: [createEmptyVariantForm()],
    pricingRules: [createEmptyPricingRuleForm('UNIT')],
  };
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sanitizeLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toOptionalNumber(value: string) {
  const normalized = value.trim();
  return normalized ? Number(normalized) : undefined;
}

function toRequiredNumber(value: string) {
  const normalized = value.trim();
  return normalized ? Number(normalized) : 0;
}

function categoryToForm(category: CatalogAdminCategory): CategoryFormState {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    imageUrl: category.imageUrl ?? '',
    sortOrder: String(category.sortOrder ?? 0),
    active: category.active,
  };
}

function productToForm(product: CatalogAdminProduct): ProductFormState {
  return {
    id: product.id,
    categoryId: product.category.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sku: product.sku,
    pricingModel: product.pricingModel,
    featured: product.featured,
    active: product.active,
    imageUrl: product.metadata?.imageUrl ?? '',
    marketingTitle: product.metadata?.marketingTitle ?? '',
    marketingDescription: product.metadata?.marketingDescription ?? '',
    heroCopy: product.metadata?.heroCopy ?? '',
    proofPoints: (product.metadata?.proofPoints ?? []).join('\n'),
    baseColorOptions: (product.baseColorOptions ?? []).join(', '),
    printableSurfaces: (product.printableSurfaces ?? []).join(', '),
    variants:
      product.variants.length > 0
        ? product.variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            name: variant.name,
            color: variant.color ?? '',
            size: variant.size ?? '',
            stock: String(variant.stock),
            isDefault: Boolean(variant.isDefault),
          }))
        : [createEmptyVariantForm()],
    pricingRules:
      product.pricingRules.length > 0
        ? product.pricingRules.map((rule) => ({
            id: rule.id,
            pricingModel: product.pricingModel,
            minQuantity: rule.minQuantity != null ? String(rule.minQuantity) : '',
            maxQuantity: rule.maxQuantity != null ? String(rule.maxQuantity) : '',
            baseUnitPrice: rule.baseUnitPrice != null ? String(rule.baseUnitPrice) : '',
            estimatedUnitCost: rule.estimatedUnitCost != null ? String(rule.estimatedUnitCost) : '',
            pricePerSquareMeter:
              rule.pricePerSquareMeter != null ? String(rule.pricePerSquareMeter) : '',
            estimatedCostPerSquareMeter:
              rule.estimatedCostPerSquareMeter != null
                ? String(rule.estimatedCostPerSquareMeter)
                : '',
            personalizationMultiplier:
              rule.personalizationMultiplier != null
                ? String(rule.personalizationMultiplier)
                : '1',
            setupFee: rule.setupFee != null ? String(rule.setupFee) : '',
            active: rule.active ?? true,
          }))
        : [createEmptyPricingRuleForm(product.pricingModel)],
  };
}

type CatalogAdminManagerProps = {
  initialCategories: CatalogAdminCategory[];
  initialProducts: CatalogAdminProduct[];
};

export function CatalogAdminManager({
  initialCategories,
  initialProducts,
}: CatalogAdminManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategories[0]?.id ?? null,
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    initialProducts[0]?.id ?? null,
  );
  const [categoryFilterId, setCategoryFilterId] = useState<string>('ALL');
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(createEmptyCategoryForm());
  const [productForm, setProductForm] = useState<ProductFormState>(
    createEmptyProductForm(initialCategories[0]?.id),
  );
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<'category' | 'product' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    if (!selectedCategoryId && categories[0]) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (!selectedProductId && products[0]) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const filteredProducts = useMemo(() => {
    if (categoryFilterId === 'ALL') {
      return products;
    }
    return products.filter((product) => product.category.id === categoryFilterId);
  }, [categoryFilterId, products]);

  function resetMessages() {
    setMessage(null);
    setError(null);
  }

  function startNewCategory() {
    resetMessages();
    setSelectedCategoryId(null);
    setCategoryForm(createEmptyCategoryForm());
  }

  function startNewProduct() {
    resetMessages();
    setSelectedProductId(null);
    setProductForm(createEmptyProductForm(selectedCategoryId ?? categories[0]?.id));
  }

  function selectCategory(category: CatalogAdminCategory) {
    resetMessages();
    setSelectedCategoryId(category.id);
    setCategoryForm(categoryToForm(category));
  }

  function selectProduct(product: CatalogAdminProduct) {
    resetMessages();
    setSelectedProductId(product.id);
    setProductForm(productToForm(product));
  }

  function setCategoryField<K extends keyof CategoryFormState>(key: K, value: CategoryFormState[K]) {
    setCategoryForm((current) => ({ ...current, [key]: value }));
  }

  function setProductField<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setProductForm((current) => ({ ...current, [key]: value }));
  }

  function setVariantField(
    index: number,
    key: keyof ProductVariantFormState,
    value: string | boolean,
  ) {
    setProductForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [key]: value } : variant,
      ),
    }));
  }

  function setPricingRuleField(
    index: number,
    key: keyof ProductPricingRuleFormState,
    value: string | boolean,
  ) {
    setProductForm((current) => ({
      ...current,
      pricingRules: current.pricingRules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [key]: value } : rule,
      ),
    }));
  }

  function appendVariant() {
    setProductForm((current) => ({
      ...current,
      variants: [...current.variants, createEmptyVariantForm()],
    }));
  }

  function removeVariant(index: number) {
    setProductForm((current) => ({
      ...current,
      variants:
        current.variants.length === 1
          ? [createEmptyVariantForm()]
          : current.variants.filter((_, variantIndex) => variantIndex !== index),
    }));
  }

  function appendPricingRule() {
    setProductForm((current) => ({
      ...current,
      pricingRules: [...current.pricingRules, createEmptyPricingRuleForm(current.pricingModel)],
    }));
  }

  function removePricingRule(index: number) {
    setProductForm((current) => ({
      ...current,
      pricingRules:
        current.pricingRules.length === 1
          ? [createEmptyPricingRuleForm(current.pricingModel)]
          : current.pricingRules.filter((_, ruleIndex) => ruleIndex !== index),
    }));
  }

  async function uploadImage(
    event: ChangeEvent<HTMLInputElement>,
    target: 'category' | 'product',
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    resetMessages();
    setUploadingTarget(target);

    try {
      const payload = new FormData();
      payload.append('file', file);

      const result = await requestClientApi<{ assetUrl: string }>('/design/assets', {
        method: 'POST',
        body: payload,
      });

      if (!result.response.ok || !result.payload?.assetUrl) {
        throw new Error(
          extractClientApiError(result, `No fue posible subir la imagen (${result.response.status})`),
        );
      }

      if (target === 'category') {
        setCategoryField('imageUrl', result.payload.assetUrl);
      } else {
        setProductField('imageUrl', result.payload.assetUrl);
      }

      setMessage('Imagen cargada correctamente.');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible cargar la imagen.',
      );
    } finally {
      event.target.value = '';
      setUploadingTarget(null);
    }
  }

  async function saveCategory() {
    resetMessages();
    setSavingCategory(true);

    try {
      const slug = slugify(categoryForm.slug || categoryForm.name);
      const body = {
        name: categoryForm.name.trim(),
        slug,
        description: categoryForm.description.trim() || undefined,
        imageUrl: categoryForm.imageUrl.trim() || undefined,
        sortOrder: Number(categoryForm.sortOrder || 0),
        active: categoryForm.active,
      };

      const result = await requestClientApi<CatalogAdminCategory>(
        categoryForm.id ? `/catalog/admin/categories/${categoryForm.id}` : '/catalog/admin/categories',
        {
          method: categoryForm.id ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );

      if (!result.response.ok || !result.payload) {
        throw new Error(
          extractClientApiError(result, `No fue posible guardar la categoria (${result.response.status})`),
        );
      }

      setCategories((current) => {
        const next = categoryForm.id
          ? current.map((category) => (category.id === result.payload!.id ? result.payload! : category))
          : [result.payload!, ...current];
        return next.sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
      });

      setSelectedCategoryId(result.payload.id);
      setCategoryForm(categoryToForm(result.payload));
      setMessage(categoryForm.id ? 'Categoria actualizada correctamente.' : 'Categoria creada correctamente.');
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible guardar la categoria.',
      );
    } finally {
      setSavingCategory(false);
    }
  }

  async function deleteCategory() {
    if (!categoryForm.id) {
      setCategoryForm(createEmptyCategoryForm());
      return;
    }

    resetMessages();
    setSavingCategory(true);

    try {
      const result = await requestClientApi<{
        status: 'deleted' | 'archived';
        message: string;
        category?: CatalogAdminCategory;
      }>(`/catalog/admin/categories/${categoryForm.id}`, {
        method: 'DELETE',
      });

      if (!result.response.ok) {
        throw new Error(
          extractClientApiError(result, `No fue posible borrar la categoria (${result.response.status})`),
        );
      }

      if (result.payload?.status === 'archived' && result.payload.category) {
        setCategories((current) =>
          current.map((category) =>
            category.id === result.payload!.category!.id ? result.payload!.category! : category,
          ),
        );
        setCategoryForm(categoryToForm(result.payload.category));
        setMessage(result.payload.message);
      } else {
        setCategories((current) => current.filter((category) => category.id !== categoryForm.id));
        setSelectedCategoryId(null);
        setCategoryForm(createEmptyCategoryForm());
        setMessage(result.payload?.message ?? 'Categoria eliminada correctamente.');
      }

      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible borrar la categoria.',
      );
    } finally {
      setSavingCategory(false);
    }
  }

  async function saveProduct() {
    resetMessages();
    setSavingProduct(true);

    try {
      const slug = slugify(productForm.slug || productForm.name);
      const body = {
        categoryId: productForm.categoryId,
        name: productForm.name.trim(),
        slug,
        description: productForm.description.trim(),
        sku: productForm.sku.trim(),
        pricingModel: productForm.pricingModel,
        featured: productForm.featured,
        active: productForm.active,
        baseColorOptions: sanitizeLines(productForm.baseColorOptions),
        printableSurfaces: sanitizeLines(productForm.printableSurfaces),
        metadata: {
          imageUrl: productForm.imageUrl.trim() || undefined,
          marketingTitle: productForm.marketingTitle.trim() || undefined,
          marketingDescription: productForm.marketingDescription.trim() || undefined,
          heroCopy: productForm.heroCopy.trim() || undefined,
          proofPoints: sanitizeLines(productForm.proofPoints),
        },
        variants: productForm.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku.trim(),
          name: variant.name.trim(),
          color: variant.color.trim() || undefined,
          size: variant.size.trim() || undefined,
          stock: toRequiredNumber(variant.stock),
          isDefault: variant.isDefault,
        })),
        pricingRules: productForm.pricingRules.map((rule) => ({
          id: rule.id,
          pricingModel: productForm.pricingModel,
          minQuantity: toOptionalNumber(rule.minQuantity),
          maxQuantity: toOptionalNumber(rule.maxQuantity),
          baseUnitPrice: toOptionalNumber(rule.baseUnitPrice),
          estimatedUnitCost: toOptionalNumber(rule.estimatedUnitCost),
          pricePerSquareMeter: toOptionalNumber(rule.pricePerSquareMeter),
          estimatedCostPerSquareMeter: toOptionalNumber(rule.estimatedCostPerSquareMeter),
          personalizationMultiplier: toOptionalNumber(rule.personalizationMultiplier),
          setupFee: toOptionalNumber(rule.setupFee),
          active: rule.active,
        })),
      };

      const result = await requestClientApi<CatalogAdminProduct>(
        productForm.id ? `/catalog/admin/products/${productForm.id}` : '/catalog/admin/products',
        {
          method: productForm.id ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );

      if (!result.response.ok || !result.payload) {
        throw new Error(
          extractClientApiError(result, `No fue posible guardar el producto (${result.response.status})`),
        );
      }

      setProducts((current) => {
        const next = productForm.id
          ? current.map((product) => (product.id === result.payload!.id ? result.payload! : product))
          : [result.payload!, ...current];
        return [...next].sort((left, right) => Number(right.featured) - Number(left.featured) || left.name.localeCompare(right.name));
      });

      setSelectedProductId(result.payload.id);
      setProductForm(productToForm(result.payload));
      setMessage(productForm.id ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible guardar el producto.',
      );
    } finally {
      setSavingProduct(false);
    }
  }

  async function deleteProduct() {
    if (!productForm.id) {
      setProductForm(createEmptyProductForm(selectedCategoryId ?? categories[0]?.id));
      return;
    }

    resetMessages();
    setSavingProduct(true);

    try {
      const result = await requestClientApi<{
        status: 'deleted' | 'archived';
        message: string;
        product?: CatalogAdminProduct;
      }>(`/catalog/admin/products/${productForm.id}`, {
        method: 'DELETE',
      });

      if (!result.response.ok) {
        throw new Error(
          extractClientApiError(result, `No fue posible borrar el producto (${result.response.status})`),
        );
      }

      if (result.payload?.status === 'archived' && result.payload.product) {
        setProducts((current) =>
          current.map((product) =>
            product.id === result.payload!.product!.id ? result.payload!.product! : product,
          ),
        );
        setProductForm(productToForm(result.payload.product));
        setMessage(result.payload.message);
      } else {
        setProducts((current) => current.filter((product) => product.id !== productForm.id));
        setSelectedProductId(null);
        setProductForm(createEmptyProductForm(selectedCategoryId ?? categories[0]?.id));
        setMessage(result.payload?.message ?? 'Producto eliminado correctamente.');
      }

      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible borrar el producto.',
      );
    } finally {
      setSavingProduct(false);
    }
  }

  return (
    <div className="space-y-8">
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <article className="admin-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Categorias</h2>
              <p className="mt-1 text-sm text-slate-600">
                Crea familias, ordena el catalogo y sube su imagen de portada.
              </p>
            </div>
            <button
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              onClick={startNewCategory}
              type="button"
            >
              Nueva categoria
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {categories.map((category) => (
              <button
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  selectedCategoryId === category.id
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                key={category.id}
                onClick={() => selectCategory(category)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{category.name}</p>
                    <p className="text-sm text-slate-600">{category.slug}</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    {category.active ? 'Activa' : 'Archivada'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{category._count.products} producto(s)</p>
              </button>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Nombre
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => {
                    const nextName = event.target.value;
                    setCategoryField('name', nextName);
                    if (!categoryForm.id) {
                      setCategoryField('slug', slugify(nextName));
                    }
                  }}
                  value={categoryForm.name}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Slug
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setCategoryField('slug', slugify(event.target.value))}
                  value={categoryForm.slug}
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Descripcion
              <textarea
                className="min-h-[110px] rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                onChange={(event) => setCategoryField('description', event.target.value)}
                value={categoryForm.description}
              />
            </label>

            <div className="grid gap-4 lg:grid-cols-[1fr_200px_160px]">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Imagen
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setCategoryField('imageUrl', event.target.value)}
                  value={categoryForm.imageUrl}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Orden
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setCategoryField('sortOrder', event.target.value)}
                  type="number"
                  value={categoryForm.sortOrder}
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <input
                  checked={categoryForm.active}
                  onChange={(event) => setCategoryField('active', event.target.checked)}
                  type="checkbox"
                />
                Activa
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700">
                {uploadingTarget === 'category' ? 'Subiendo...' : 'Subir imagen'}
                <input
                  className="hidden"
                  disabled={uploadingTarget !== null}
                  onChange={(event) => {
                    void uploadImage(event, 'category');
                  }}
                  type="file"
                />
              </label>
              {categoryForm.imageUrl ? (
                <a
                  className="text-sm text-sky-700 underline"
                  href={categoryForm.imageUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Ver imagen
                </a>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savingCategory}
                onClick={() => {
                  void saveCategory();
                }}
                type="button"
              >
                {savingCategory ? 'Guardando...' : categoryForm.id ? 'Guardar cambios' : 'Crear categoria'}
              </button>
              <button
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                onClick={startNewCategory}
                type="button"
              >
                Limpiar
              </button>
              {categoryForm.id ? (
                <button
                  className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                  disabled={savingCategory}
                  onClick={() => {
                    void deleteCategory();
                  }}
                  type="button"
                >
                  Archivar / borrar
                </button>
              ) : null}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <article className="admin-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Productos</h2>
              <p className="mt-1 text-sm text-slate-600">
                Administra catalogo, mockups, copys, variantes y reglas de precio.
              </p>
            </div>
            <button
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
              onClick={startNewProduct}
              type="button"
            >
              Nuevo producto
            </button>
          </div>

          <label className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
            Filtrar por categoria
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
              onChange={(event) => setCategoryFilterId(event.target.value)}
              value={categoryFilterId}
            >
              <option value="ALL">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-5 space-y-3">
            {filteredProducts.map((product) => (
              <button
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  selectedProductId === product.id
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                key={product.id}
                onClick={() => selectProduct(product)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{product.name}</p>
                    <p className="text-sm text-slate-600">
                      {product.category.name} - {product.sku}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {product.featured ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                        En home
                      </span>
                    ) : null}
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      {product.active ? 'Activo' : 'Archivado'}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {product.variants.length} variante(s) - {product.pricingRules.length} regla(s)
                </p>
              </button>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Categoria
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setProductField('categoryId', event.target.value)}
                  value={productForm.categoryId}
                >
                  <option value="">Selecciona una categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Pricing model
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => {
                    const nextModel = event.target.value as 'UNIT' | 'AREA';
                    setProductField('pricingModel', nextModel);
                    setProductForm((current) => ({
                      ...current,
                      pricingModel: nextModel,
                      pricingRules: current.pricingRules.map((rule) => ({
                        ...rule,
                        pricingModel: nextModel,
                      })),
                    }));
                  }}
                  value={productForm.pricingModel}
                >
                  <option value="UNIT">UNIT</option>
                  <option value="AREA">AREA</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Nombre
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => {
                    const nextName = event.target.value;
                    setProductField('name', nextName);
                    if (!productForm.id) {
                      setProductField('slug', slugify(nextName));
                    }
                  }}
                  value={productForm.name}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Slug
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setProductField('slug', slugify(event.target.value))}
                  value={productForm.slug}
                />
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                SKU base
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setProductField('sku', event.target.value)}
                  value={productForm.sku}
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <span className="flex items-center gap-3">
                    <input
                      checked={productForm.featured}
                      onChange={(event) => setProductField('featured', event.target.checked)}
                      type="checkbox"
                    />
                    <span className="font-medium text-slate-900">Mostrar en pagina principal</span>
                  </span>
                  <span className="text-xs leading-5 text-slate-500">
                    Este producto aparecera en la home en la seccion de destacados.
                  </span>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <input
                    checked={productForm.active}
                    onChange={(event) => setProductField('active', event.target.checked)}
                    type="checkbox"
                  />
                  Activo
                </label>
              </div>
            </div>

            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Descripcion
              <textarea
                className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                onChange={(event) => setProductField('description', event.target.value)}
                value={productForm.description}
              />
            </label>

            <div className="grid gap-4 xl:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Imagen principal
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setProductField('imageUrl', event.target.value)}
                  value={productForm.imageUrl}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Titulo comercial
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setProductField('marketingTitle', event.target.value)}
                  value={productForm.marketingTitle}
                />
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Hero copy
                <textarea
                  className="min-h-[110px] rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setProductField('heroCopy', event.target.value)}
                  value={productForm.heroCopy}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Descripcion comercial
                <textarea
                  className="min-h-[110px] rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setProductField('marketingDescription', event.target.value)}
                  value={productForm.marketingDescription}
                />
              </label>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Proof points
                <textarea
                  className="min-h-[110px] rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setProductField('proofPoints', event.target.value)}
                  placeholder="Uno por linea"
                  value={productForm.proofPoints}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Colores base
                <textarea
                  className="min-h-[110px] rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setProductField('baseColorOptions', event.target.value)}
                  placeholder="blanco, negro, azul"
                  value={productForm.baseColorOptions}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Superficies imprimibles
                <textarea
                  className="min-h-[110px] rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-sky-300"
                  onChange={(event) => setProductField('printableSurfaces', event.target.value)}
                  placeholder="front, back, sleeve"
                  value={productForm.printableSurfaces}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700">
                {uploadingTarget === 'product' ? 'Subiendo...' : 'Subir imagen'}
                <input
                  className="hidden"
                  disabled={uploadingTarget !== null}
                  onChange={(event) => {
                    void uploadImage(event, 'product');
                  }}
                  type="file"
                />
              </label>
              {productForm.imageUrl ? (
                <a
                  className="text-sm text-sky-700 underline"
                  href={productForm.imageUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Ver imagen
                </a>
              ) : null}
            </div>

            <section className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">Variantes</h3>
                  <p className="text-sm text-slate-600">Colores, tallas y SKU operativos.</p>
                </div>
                <button
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                  onClick={appendVariant}
                  type="button"
                >
                  Agregar variante
                </button>
              </div>

              <div className="space-y-4">
                {productForm.variants.map((variant, index) => (
                  <div
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:grid-cols-[1.2fr_1.2fr_1fr_1fr_120px_110px_auto]"
                    key={`${variant.id ?? 'new'}-${index}`}
                  >
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300"
                      onChange={(event) => setVariantField(index, 'sku', event.target.value)}
                      placeholder="SKU"
                      value={variant.sku}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300"
                      onChange={(event) => setVariantField(index, 'name', event.target.value)}
                      placeholder="Nombre"
                      value={variant.name}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300"
                      onChange={(event) => setVariantField(index, 'color', event.target.value)}
                      placeholder="Color"
                      value={variant.color}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300"
                      onChange={(event) => setVariantField(index, 'size', event.target.value)}
                      placeholder="Talla"
                      value={variant.size}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300"
                      onChange={(event) => setVariantField(index, 'stock', event.target.value)}
                      placeholder="Stock"
                      type="number"
                      value={variant.stock}
                    />
                    <label className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700">
                      <input
                        checked={variant.isDefault}
                        onChange={(event) => setVariantField(index, 'isDefault', event.target.checked)}
                        type="checkbox"
                      />
                      Default
                    </label>
                    <button
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      onClick={() => removeVariant(index)}
                      type="button"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">Pricing rules</h3>
                  <p className="text-sm text-slate-600">Escalas comerciales y costos estimados.</p>
                </div>
                <button
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                  onClick={appendPricingRule}
                  type="button"
                >
                  Agregar regla
                </button>
              </div>

              <div className="space-y-4">
                {productForm.pricingRules.map((rule, index) => (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4" key={`${rule.id ?? 'new'}-${index}`}>
                    <div className="grid gap-3 xl:grid-cols-4">
                      <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300" onChange={(event) => setPricingRuleField(index, 'minQuantity', event.target.value)} placeholder="Min quantity" type="number" value={rule.minQuantity} />
                      <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300" onChange={(event) => setPricingRuleField(index, 'maxQuantity', event.target.value)} placeholder="Max quantity" type="number" value={rule.maxQuantity} />
                      <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300" onChange={(event) => setPricingRuleField(index, 'baseUnitPrice', event.target.value)} placeholder="Precio unitario" type="number" value={rule.baseUnitPrice} />
                      <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300" onChange={(event) => setPricingRuleField(index, 'estimatedUnitCost', event.target.value)} placeholder="Costo unitario" type="number" value={rule.estimatedUnitCost} />
                      <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300" onChange={(event) => setPricingRuleField(index, 'pricePerSquareMeter', event.target.value)} placeholder="Precio por m2" type="number" value={rule.pricePerSquareMeter} />
                      <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300" onChange={(event) => setPricingRuleField(index, 'estimatedCostPerSquareMeter', event.target.value)} placeholder="Costo por m2" type="number" value={rule.estimatedCostPerSquareMeter} />
                      <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300" onChange={(event) => setPricingRuleField(index, 'personalizationMultiplier', event.target.value)} placeholder="Multiplicador" type="number" value={rule.personalizationMultiplier} />
                      <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-300" onChange={(event) => setPricingRuleField(index, 'setupFee', event.target.value)} placeholder="Setup fee" type="number" value={rule.setupFee} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700">
                        <input checked={rule.active} onChange={(event) => setPricingRuleField(index, 'active', event.target.checked)} type="checkbox" />
                        Activa
                      </label>
                      <button
                        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                        onClick={() => removePricingRule(index)}
                        type="button"
                      >
                        Quitar regla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savingProduct}
                onClick={() => {
                  void saveProduct();
                }}
                type="button"
              >
                {savingProduct ? 'Guardando...' : productForm.id ? 'Guardar producto' : 'Crear producto'}
              </button>
              <button
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                onClick={startNewProduct}
                type="button"
              >
                Limpiar
              </button>
              {productForm.id ? (
                <button
                  className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                  disabled={savingProduct}
                  onClick={() => {
                    void deleteProduct();
                  }}
                  type="button"
                >
                  Archivar / borrar
                </button>
              ) : null}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
