import { PrismaClient } from '@prisma/client';

import { APP_ROLES, DEFAULT_ROLE_PERMISSIONS } from '../../shared/src/rbac.ts';

const prisma = new PrismaClient();
const DEFAULT_TENANT_ID = 'hn-main';
const PricingModel = {
  UNIT: 'UNIT',
  AREA: 'AREA',
} as const;

async function seedRolesAndPermissions() {
  const permissions = await Promise.all(
    Array.from(new Set(Object.values(DEFAULT_ROLE_PERMISSIONS).flat())).map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: {
          name,
          description: `Permission ${name}`,
        },
      }),
    ),
  );

  for (const roleName of APP_ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `System role ${roleName}`,
      },
    });

    for (const permissionName of DEFAULT_ROLE_PERMISSIONS[roleName]) {
      const permission = permissions.find((item) => item.name === permissionName);

      if (!permission) {
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

async function seedUsers() {
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } });
  const managerRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'manager' },
  });
  const salesRole = await prisma.role.findUniqueOrThrow({ where: { name: 'sales' } });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@subligo.com' },
    update: {},
    create: {
      email: 'admin@subligo.com',
      passwordHash: '$2b$12$printosplaceholderhash',
      firstName: 'Darwin',
      lastName: 'Barahona',
      phone: '+50499990000',
      roleId: adminRole.id,
      twoFactorEnabled: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'gerencia@subligo.com' },
    update: {},
    create: {
      email: 'gerencia@subligo.com',
      passwordHash: '$2b$12$printosplaceholderhash',
      firstName: 'Andrea',
      lastName: 'Mejia',
      roleId: managerRole.id,
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: 'ventas@subligo.com' },
    update: {},
    create: {
      email: 'ventas@subligo.com',
      passwordHash: '$2b$12$printosplaceholderhash',
      firstName: 'Luis',
      lastName: 'Mendoza',
      roleId: salesRole.id,
    },
  });

  return { admin, manager, sales };
}

async function seedCatalog() {
  const camisetas = await prisma.productCategory.upsert({
    where: { slug: 'camisetas' },
    update: {},
    create: {
      name: 'Camisetas',
      slug: 'camisetas',
      description: 'Camisetas personalizadas para retail y eventos.',
      sortOrder: 1,
    },
  });

  const tazas = await prisma.productCategory.upsert({
    where: { slug: 'tazas' },
    update: {},
    create: {
      name: 'Tazas',
      slug: 'tazas',
      description: 'Tazas sublimadas para regalos y branding.',
      sortOrder: 2,
    },
  });

  const gorras = await prisma.productCategory.upsert({
    where: { slug: 'gorras' },
    update: {},
    create: {
      name: 'Gorras',
      slug: 'gorras',
      description: 'Gorras promocionales y deportivas.',
      sortOrder: 3,
    },
  });

  const tumblers = await prisma.productCategory.upsert({
    where: { slug: 'botellas-tumblers' },
    update: {},
    create: {
      name: 'Botellas/Tumblers',
      slug: 'botellas-tumblers',
      description: 'Botellas metalicas y tumblers personalizados.',
      sortOrder: 4,
    },
  });

  const banners = await prisma.productCategory.upsert({
    where: { slug: 'banner-lona' },
    update: {},
    create: {
      name: 'Banner/Lona',
      slug: 'banner-lona',
      description: 'Impresion en gran formato con pricing por area.',
      sortOrder: 5,
    },
  });

  await Promise.all([
    prisma.productCategory.upsert({
      where: { slug: 'mousepad' },
      update: {},
      create: {
        name: 'Mousepad',
        slug: 'mousepad',
        description: 'Mousepads personalizados para branding y regalos.',
        sortOrder: 6,
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: 'stickers' },
      update: {},
      create: {
        name: 'Stickers',
        slug: 'stickers',
        description: 'Stickers troquelados y promocionales.',
        sortOrder: 7,
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: 'etiquetas' },
      update: {},
      create: {
        name: 'Etiquetas',
        slug: 'etiquetas',
        description: 'Etiquetas adhesivas para retail y empaque.',
        sortOrder: 8,
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: 'microperforado' },
      update: {},
      create: {
        name: 'Microperforado',
        slug: 'microperforado',
        description: 'Impresion microperforada para vitrinas y vehiculos.',
        sortOrder: 9,
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: 'vinil-adhesivo' },
      update: {},
      create: {
        name: 'Vinil adhesivo',
        slug: 'vinil-adhesivo',
        description: 'Vinil adhesivo para rotulacion y branding.',
        sortOrder: 10,
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: 'pvc' },
      update: {},
      create: {
        name: 'PVC',
        slug: 'pvc',
        description: 'Senalizacion rigida sobre PVC.',
        sortOrder: 11,
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: 'coroplast' },
      update: {},
      create: {
        name: 'Coroplast',
        slug: 'coroplast',
        description: 'Material liviano para campanas y senaletica.',
        sortOrder: 12,
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: 'roll-up-x-banner' },
      update: {},
      create: {
        name: 'Roll-up/X-Banner',
        slug: 'roll-up-x-banner',
        description: 'Displays y portabanners para eventos.',
        sortOrder: 13,
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: 'rotulos-impresos' },
      update: {},
      create: {
        name: 'Rotulos impresos',
        slug: 'rotulos-impresos',
        description: 'Rotulos impresos para comercios y activaciones.',
        sortOrder: 14,
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: 'paquetes-para-negocios' },
      update: {},
      create: {
        name: 'Paquetes para negocios',
        slug: 'paquetes-para-negocios',
        description: 'Combos de branding para emprendimientos y pymes.',
        sortOrder: 15,
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: 'servicios-corporativos' },
      update: {},
      create: {
        name: 'Servicios corporativos',
        slug: 'servicios-corporativos',
        description: 'Atencion B2B, compras recurrentes y kits empresariales.',
        sortOrder: 16,
      },
    }),
  ]);

  const camiseta = await prisma.product.upsert({
    where: { slug: 'camiseta-unisex-premium' },
    update: {},
    create: {
      categoryId: camisetas.id,
      name: 'Camiseta Unisex Premium',
      slug: 'camiseta-unisex-premium',
      description: 'Camiseta dry fit con impresion frontal y posterior.',
      sku: 'CAM-PREM-001',
      pricingModel: PricingModel.UNIT,
      printableSurfaces: ['front', 'back'],
      baseColorOptions: ['blanco', 'negro', 'gris'],
      featured: true,
    },
  });

  const taza = await prisma.product.upsert({
    where: { slug: 'taza-11oz-clasica' },
    update: {},
    create: {
      categoryId: tazas.id,
      name: 'Taza 11oz Clasica',
      slug: 'taza-11oz-clasica',
      description: 'Taza sublimada de 11oz con area wrap.',
      sku: 'TAZA-11OZ-001',
      pricingModel: PricingModel.UNIT,
      printableSurfaces: ['wrap'],
      featured: true,
    },
  });

  const gorra = await prisma.product.upsert({
    where: { slug: 'gorra-trucker' },
    update: {},
    create: {
      categoryId: gorras.id,
      name: 'Gorra Trucker',
      slug: 'gorra-trucker',
      description: 'Gorra promocional con frente imprimible.',
      sku: 'GOR-TRU-001',
      pricingModel: PricingModel.UNIT,
      printableSurfaces: ['front'],
    },
  });

  const tumbler = await prisma.product.upsert({
    where: { slug: 'tumbler-20oz-metalico' },
    update: {},
    create: {
      categoryId: tumblers.id,
      name: 'Tumbler 20oz Metalico',
      slug: 'tumbler-20oz-metalico',
      description: 'Tumbler metalico con wrap completo.',
      sku: 'TUM-20-001',
      pricingModel: PricingModel.UNIT,
      printableSurfaces: ['wrap'],
    },
  });

  const banner = await prisma.product.upsert({
    where: { slug: 'banner-publicitario-premium' },
    update: {},
    create: {
      categoryId: banners.id,
      name: 'Banner Publicitario Premium',
      slug: 'banner-publicitario-premium',
      description: 'Lona premium por area con acabados e instalacion.',
      sku: 'BAN-LON-001',
      pricingModel: PricingModel.AREA,
      printableSurfaces: ['front'],
      featured: true,
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: 'CAM-PREM-001-BL-M' },
    update: {},
    create: {
      productId: camiseta.id,
      sku: 'CAM-PREM-001-BL-M',
      name: 'Blanco M',
      color: 'Blanco',
      size: 'M',
      stock: 40,
      isDefault: true,
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: 'TAZA-11OZ-001-BL' },
    update: {},
    create: {
      productId: taza.id,
      sku: 'TAZA-11OZ-001-BL',
      name: 'Blanca',
      color: 'Blanco',
      stock: 120,
      isDefault: true,
    },
  });

  await prisma.productPricingRule.deleteMany();
  await prisma.productPricingRule.createMany({
    data: [
      {
        productId: camiseta.id,
        pricingModel: PricingModel.UNIT,
        minQuantity: 1,
        baseUnitPrice: 185,
        estimatedUnitCost: 112,
        personalizationMultiplier: 1.15,
        setupFee: 0,
      },
      {
        productId: taza.id,
        pricingModel: PricingModel.UNIT,
        minQuantity: 1,
        baseUnitPrice: 95,
        estimatedUnitCost: 52,
        personalizationMultiplier: 1.05,
        setupFee: 0,
      },
      {
        productId: gorra.id,
        pricingModel: PricingModel.UNIT,
        minQuantity: 1,
        baseUnitPrice: 145,
        estimatedUnitCost: 88,
        personalizationMultiplier: 1.1,
        setupFee: 0,
      },
      {
        productId: tumbler.id,
        pricingModel: PricingModel.UNIT,
        minQuantity: 1,
        baseUnitPrice: 210,
        estimatedUnitCost: 138,
        personalizationMultiplier: 1.12,
        setupFee: 0,
      },
      {
        productId: banner.id,
        pricingModel: PricingModel.AREA,
        minQuantity: 1,
        pricePerSquareMeter: 480,
        estimatedCostPerSquareMeter: 285,
        setupFee: 150,
        minWidthMeters: 0.5,
        minHeightMeters: 0.5,
        finishingOptions: { hem: 120, eyelets: 90 },
        installationOptions: { local: 450, premium: 850 },
      },
    ],
  });

  return { camiseta, taza, banner };
}

async function resetOperationalData() {
  await prisma.auditLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.artwork.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.designSession.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.analyticsSnapshot.deleteMany();
  await prisma.contentCalendar.deleteMany();
  await prisma.adPerformance.deleteMany();
  await prisma.campaignAsset.deleteMany();
  await prisma.socialSignal.deleteMany();
  await prisma.agentFinding.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.campaign.deleteMany();
}

async function main() {
  await seedRolesAndPermissions();
  const { admin, manager, sales } = await seedUsers();
  const { camiseta, taza, banner } = await seedCatalog();

  await resetOperationalData();

  const company = await prisma.company.upsert({
    where: { id: 'company-bistro-central' },
    update: {},
    create: {
      id: 'company-bistro-central',
      name: 'Bistro Central',
      taxId: '08011999123456',
      industry: 'Restaurante',
      city: 'Tegucigalpa',
      address: 'Colonia Palmira',
    },
  });

  const maria = await prisma.customer.upsert({
    where: { email: 'contacto@bistrocentral.hn' },
    update: {
      companyId: company.id,
      phone: '+50499001122',
      whatsappOptIn: true,
      totalLifetimeValue: 7800,
      totalOrders: 2,
      billingAddress: {
        taxId: '08011999123456',
        businessName: 'Bistro Central',
        contactName: 'Maria Lopez',
        email: 'contacto@bistrocentral.hn',
        city: 'Tegucigalpa',
        line1: 'Colonia Palmira',
      },
    },
    create: {
      companyId: company.id,
      firstName: 'Maria',
      lastName: 'Lopez',
      email: 'contacto@bistrocentral.hn',
      phone: '+50499001122',
      whatsappOptIn: true,
      totalLifetimeValue: 7800,
      totalOrders: 2,
      billingAddress: {
        taxId: '08011999123456',
        businessName: 'Bistro Central',
        contactName: 'Maria Lopez',
        email: 'contacto@bistrocentral.hn',
        city: 'Tegucigalpa',
        line1: 'Colonia Palmira',
      },
    },
  });

  const carlos = await prisma.customer.upsert({
    where: { email: 'compras@gymzone.hn' },
    update: {
      phone: '+50497774455',
      whatsappOptIn: true,
      totalLifetimeValue: 3450,
      totalOrders: 1,
      billingAddress: {
        taxId: '08011988001234',
        businessName: 'Gym Zone',
        contactName: 'Carlos Rivas',
        email: 'compras@gymzone.hn',
        city: 'San Pedro Sula',
        line1: 'Colonia Trejo',
      },
    },
    create: {
      firstName: 'Carlos',
      lastName: 'Rivas',
      email: 'compras@gymzone.hn',
      phone: '+50497774455',
      whatsappOptIn: true,
      totalLifetimeValue: 3450,
      totalOrders: 1,
      billingAddress: {
        taxId: '08011988001234',
        businessName: 'Gym Zone',
        contactName: 'Carlos Rivas',
        email: 'compras@gymzone.hn',
        city: 'San Pedro Sula',
        line1: 'Colonia Trejo',
      },
    },
  });

  const ana = await prisma.customer.upsert({
    where: { email: 'eventos@colegiosol.hn' },
    update: {
      phone: '+50496663322',
      totalLifetimeValue: 1800,
      totalOrders: 1,
      lastOrderAt: new Date('2025-11-10T15:00:00.000Z'),
      billingAddress: {
        taxId: '08011977004567',
        businessName: 'Colegio Sol',
        contactName: 'Ana Pineda',
        email: 'eventos@colegiosol.hn',
        city: 'Tegucigalpa',
        line1: 'Boulevard Morazan',
      },
    },
    create: {
      firstName: 'Ana',
      lastName: 'Pineda',
      email: 'eventos@colegiosol.hn',
      phone: '+50496663322',
      totalLifetimeValue: 1800,
      totalOrders: 1,
      lastOrderAt: new Date('2025-11-10T15:00:00.000Z'),
      billingAddress: {
        taxId: '08011977004567',
        businessName: 'Colegio Sol',
        contactName: 'Ana Pineda',
        email: 'eventos@colegiosol.hn',
        city: 'Tegucigalpa',
        line1: 'Boulevard Morazan',
      },
    },
  });

  const rosa = await prisma.customer.upsert({
    where: { email: 'marketing@petitcafe.hn' },
    update: {},
    create: {
      firstName: 'Rosa',
      lastName: 'Aguilar',
      email: 'marketing@petitcafe.hn',
      phone: '+50495551234',
      totalLifetimeValue: 0,
      totalOrders: 0,
      notes: 'Lead historico de web chat que no cerro por presupuesto.',
    },
  });

  const lead = await prisma.lead.create({
    data: {
      companyId: company.id,
      customerId: maria.id,
      assignedToId: sales.id,
      source: 'WhatsApp',
      channel: 'WHATSAPP',
      stage: 'QUOTED',
      score: 82,
      contactName: 'Maria Lopez',
      email: maria.email,
      phone: maria.phone,
      city: 'Tegucigalpa',
      notes: 'Necesita banner de 2x1.5m y 30 tazas para una promocion.',
      interests: ['banner', 'tazas'],
      quotedValue: 4025,
    },
  });

  const carlosLead = await prisma.lead.create({
    data: {
      customerId: carlos.id,
      assignedToId: sales.id,
      source: 'Instagram Ads',
      channel: 'INSTAGRAM',
      stage: 'CONTACTED',
      score: 74,
      contactName: 'Carlos Rivas',
      email: carlos.email,
      phone: carlos.phone,
      city: 'San Pedro Sula',
      notes: 'Interesado en tumblers y kits de onboarding para 20 colaboradores.',
      interests: ['tumbler', 'branding', 'corporativo'],
      quotedValue: 4200,
    },
  });

  const anaLead = await prisma.lead.create({
    data: {
      customerId: ana.id,
      assignedToId: sales.id,
      source: 'Email',
      channel: 'EMAIL',
      stage: 'CLOSED_WON',
      score: 91,
      contactName: 'Ana Pineda',
      email: ana.email,
      phone: ana.phone,
      city: 'Tegucigalpa',
      notes: 'Cerro compra de material escolar y senaletica para feria institucional.',
      interests: ['banner', 'roll-up'],
      quotedValue: 1800,
      convertedAt: new Date('2025-11-10T15:00:00.000Z'),
    },
  });

  await prisma.lead.create({
    data: {
      customerId: rosa.id,
      assignedToId: sales.id,
      source: 'Web Chat',
      channel: 'WEB_CHAT',
      stage: 'CLOSED_LOST',
      score: 39,
      contactName: 'Rosa Aguilar',
      email: rosa.email,
      phone: rosa.phone,
      city: 'Tegucigalpa',
      notes: 'Pregunto por rotulacion para cafeteria, pero pauso el presupuesto.',
      interests: ['rotulo', 'vinil'],
      quotedValue: 950,
      lostReason: 'Sin presupuesto este mes',
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      customerId: maria.id,
      leadId: lead.id,
      assignedToId: sales.id,
      channel: 'WHATSAPP',
      intent: 'QUOTE',
      subject: 'Promocion de temporada',
      messages: {
        create: [
          {
            direction: 'INBOUND',
            senderName: 'Maria Lopez',
            content: 'Hola, necesito banner y 30 tazas para una promocion.',
          },
          {
            direction: 'OUTBOUND',
            senderName: 'Luis Mendoza',
            content: 'Perfecto, te comparto la cotizacion y el tiempo de entrega.',
          },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      customerId: carlos.id,
      leadId: carlosLead.id,
      assignedToId: sales.id,
      channel: 'INSTAGRAM',
      intent: 'INQUIRY',
      subject: 'Tumblers para onboarding',
      messages: {
        create: [
          {
            direction: 'INBOUND',
            senderName: 'Carlos Rivas',
            content: 'Vi la campana de tumblers. Necesito 20 para un onboarding corporativo.',
          },
          {
            direction: 'OUTBOUND',
            senderName: 'Luis Mendoza',
            content: 'Perfecto, te comparto opciones y una propuesta por volumen hoy mismo.',
          },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      customerId: ana.id,
      leadId: anaLead.id,
      assignedToId: sales.id,
      channel: 'EMAIL',
      intent: 'FOLLOW_UP',
      subject: 'Material escolar aprobado',
      messages: {
        create: [
          {
            direction: 'INBOUND',
            senderName: 'Ana Pineda',
            content: 'Aprobamos el material para la feria escolar. Favor continuar con produccion.',
          },
          {
            direction: 'OUTBOUND',
            senderName: 'Luis Mendoza',
            content: 'Excelente, dejo produccion confirmada y el arte final en cola para entrega.',
          },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      customerId: rosa.id,
      channel: 'WEB_CHAT',
      intent: 'QUOTE',
      subject: 'Rotulacion para cafeteria',
      messages: {
        create: [
          {
            direction: 'INBOUND',
            senderName: 'Rosa Aguilar',
            content: 'Necesito cotizar un rotulo pequeno y stickers para menus.',
          },
          {
            direction: 'OUTBOUND',
            senderName: 'SubliGo Web Chat',
            content: 'Con gusto. Te compartimos opciones de materiales y rango estimado para revisar.',
          },
        ],
      },
    },
  });

  const quote = await prisma.quote.create({
    data: {
      leadId: lead.id,
      customerId: maria.id,
      createdById: sales.id,
      quoteNumber: 'COT-2026-0001',
      status: 'APPROVED',
      subtotal: 4025,
      tax: 0,
      total: 4025,
      itemsSnapshot: [
        { sku: 'BAN-LON-001', qty: 1, areaM2: 3, total: 1890 },
        { sku: 'TAZA-11OZ-001', qty: 30, total: 2135 },
      ],
      notes: 'Cliente aprueba produccion inmediata.',
      approvedAt: new Date(),
    },
  });

  const anaQuote = await prisma.quote.create({
    data: {
      leadId: anaLead.id,
      customerId: ana.id,
      createdById: sales.id,
      quoteNumber: 'COT-2025-0098',
      status: 'APPROVED',
      subtotal: 1800,
      tax: 0,
      total: 1800,
      itemsSnapshot: [
        { sku: 'BAN-LON-001', qty: 1, areaM2: 2, total: 1800 },
      ],
      notes: 'Oferta aprobada para feria escolar.',
      approvedAt: new Date('2025-11-10T15:00:00.000Z'),
    },
  });

  const designSession = await prisma.designSession.create({
    data: {
      productId: taza.id,
      customerId: maria.id,
      status: 'ORDERED',
      sessionName: 'Promo Verano Bistro',
      canvasJson: {
        surfaces: [
          {
            surface: 'wrap',
            width: 2200,
            height: 900,
            elements: [
              {
                type: 'text',
                content: '2x1 en Frappes',
                x: 120,
                y: 160,
                fontFamily: 'Montserrat',
                fontSize: 64,
                color: '#1D4ED8',
              },
            ],
          },
        ],
      },
      previewUrl: 'https://assets.subligo.local/previews/taza-bistro.png',
      pricingSnapshot: { total: 2135, quantity: 30 },
      qualityValidation: { minDpiPassed: true },
    },
  });

  const orderOne = await prisma.order.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      customerId: maria.id,
      quoteId: quote.id,
      orderNumber: 'PED-2026-0001',
      status: 'IN_PRODUCTION',
      paymentStatus: 'PAID',
      subtotal: 4025,
      total: 4025,
      materialCost: 1540,
      laborCost: 420,
      shippingCost: 140,
      overheadCost: 210,
      actualCost: 2310,
      shippingMethod: 'Delivery local',
      checkoutSnapshot: { deliveryType: 'delivery', conversationId: conversation.id },
      placedAt: new Date(),
      paidAt: new Date(),
      items: {
        create: [
          {
            productId: banner.id,
            quantity: 1,
            unitPrice: 1890,
            areaWidthCm: 200,
            areaHeightCm: 150,
            areaSquareMeters: 3,
            productionSku: 'PROD-BAN-2026-0001',
            configuration: { finishing: 'hem', eyelets: true },
            lineTotal: 1890,
          },
          {
            productId: taza.id,
            designSessionId: designSession.id,
            quantity: 30,
            unitPrice: 71.17,
            personalizationMultiplier: 1.05,
            productionSku: 'PROD-TAZA-2026-0001',
            configuration: { wrap: true },
            lineTotal: 2135,
          },
        ],
      },
      payments: {
        create: {
          provider: 'STRIPE',
          method: 'card',
          status: 'PAID',
          amount: 4025,
          transactionId: 'pi_printos_001',
          paidAt: new Date(),
        },
      },
      shipment: {
        create: {
          carrier: 'Mensajeria Local',
          status: 'PROCESSING',
          address: { city: 'Tegucigalpa', zone: 'Palmira' },
        },
      },
    },
    include: { items: true },
  });

  await prisma.artwork.create({
    data: {
      productId: taza.id,
      designSessionId: designSession.id,
      orderItemId: orderOne.items[1]?.id,
      status: 'READY',
      fileUrl: 'https://assets.subligo.local/artworks/prod-taza-2026-0001.pdf',
      thumbnailUrl: 'https://assets.subligo.local/artworks/prod-taza-2026-0001-thumb.png',
      outputFormat: 'PDF',
      widthPx: 4961,
      heightPx: 2031,
      dpi: 300,
      productionNotes: 'Aprobado para sublimacion en lote de 30 unidades.',
    },
  });

  const readyOrder = await prisma.order.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      customerId: carlos.id,
      orderNumber: 'PED-2026-0002',
      status: 'READY',
      paymentStatus: 'PAID',
      subtotal: 3700,
      total: 3700,
      materialCost: 1540,
      laborCost: 360,
      shippingCost: 0,
      overheadCost: 220,
      actualCost: 2120,
      shippingMethod: 'Retiro en tienda',
      checkoutSnapshot: { deliveryType: 'pickup' },
      placedAt: new Date('2026-04-03T14:00:00.000Z'),
      paidAt: new Date('2026-04-03T14:05:00.000Z'),
      items: {
        create: {
          productId: camiseta.id,
          quantity: 20,
          unitPrice: 185,
          personalizationMultiplier: 1.15,
          productionSku: 'PROD-CAM-2026-0002',
          configuration: {
            color: 'Blanco',
            frontText: 'Gym Zone Team',
          },
          lineTotal: 3700,
        },
      },
      payments: {
        create: {
          provider: 'MANUAL',
          method: 'transfer',
          status: 'PAID',
          amount: 3700,
          transactionId: 'transfer_2026_0002',
          paidAt: new Date('2026-04-03T14:05:00.000Z'),
        },
      },
    },
  });

  const shippedOrder = await prisma.order.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      customerId: carlos.id,
      orderNumber: 'PED-2026-0003',
      status: 'SHIPPED',
      paymentStatus: 'PAID',
      subtotal: 2520,
      total: 2520,
      materialCost: 1080,
      laborCost: 250,
      shippingCost: 130,
      overheadCost: 140,
      actualCost: 1600,
      shippingMethod: 'Envio nacional',
      checkoutSnapshot: { deliveryType: 'delivery', source: 'phase-3-seed' },
      placedAt: new Date('2026-04-04T09:30:00.000Z'),
      paidAt: new Date('2026-04-04T09:45:00.000Z'),
      items: {
        create: {
          productId: camiseta.id,
          quantity: 12,
          unitPrice: 210,
          personalizationMultiplier: 1.1,
          productionSku: 'PROD-CAM-2026-0003',
          configuration: {
            color: 'Negro',
            frontText: 'Gym Zone Challenge',
          },
          lineTotal: 2520,
        },
      },
      payments: {
        create: {
          provider: 'MANUAL',
          method: 'transfer',
          status: 'PAID',
          amount: 2520,
          transactionId: 'transfer_2026_0003',
          paidAt: new Date('2026-04-04T09:45:00.000Z'),
        },
      },
      shipment: {
        create: {
          carrier: 'Cargo Express',
          trackingNumber: 'HN-TRK-2026-0003',
          status: 'DISPATCHED',
          shippedAt: new Date('2026-04-04T16:30:00.000Z'),
          estimatedDelivery: new Date('2026-04-06T16:00:00.000Z'),
          address: { city: 'San Pedro Sula', zone: 'Colonia Trejo' },
        },
      },
    },
    include: { items: true },
  });

  const deliveredOrder = await prisma.order.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      customerId: ana.id,
      quoteId: anaQuote.id,
      orderNumber: 'PED-2025-0098',
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      subtotal: 1800,
      total: 1800,
      materialCost: 760,
      laborCost: 120,
      shippingCost: 0,
      overheadCost: 100,
      actualCost: 980,
      shippingMethod: 'Retiro en tienda',
      checkoutSnapshot: { deliveryType: 'pickup', source: 'seed-reactivation' },
      placedAt: new Date('2025-11-10T15:00:00.000Z'),
      paidAt: new Date('2025-11-10T15:10:00.000Z'),
      items: {
        create: {
          productId: banner.id,
          quantity: 1,
          unitPrice: 900,
          areaWidthCm: 100,
          areaHeightCm: 200,
          areaSquareMeters: 2,
          productionSku: 'PROD-BAN-2025-0098',
          configuration: {
            finishing: 'eyelets',
            useCase: 'evento escolar',
          },
          lineTotal: 1800,
        },
      },
      payments: {
        create: {
          provider: 'MANUAL',
          method: 'transfer',
          status: 'PAID',
          amount: 1800,
          transactionId: 'transfer_2025_0098',
          paidAt: new Date('2025-11-10T15:10:00.000Z'),
        },
      },
    },
  });

  await prisma.invoice.createMany({
    data: [
      {
        tenantId: DEFAULT_TENANT_ID,
        orderId: orderOne.id,
        invoiceNumber: 'FE-2026-0001',
        status: 'SENT',
        documentType: 'FACTURA_ELECTRONICA_HN',
        series: 'SUB-2026',
        authorizationCode: 'CAI-2026-0001',
        customerName: 'Maria Lopez',
        customerEmail: maria.email,
        customerTaxId: '08011999123456',
        billingSnapshot: {
          businessName: 'Bistro Central',
          contactName: 'Maria Lopez',
          taxId: '08011999123456',
          email: maria.email,
          city: 'Tegucigalpa',
          line1: 'Colonia Palmira',
        },
        subtotal: 4025,
        tax: 0,
        total: 4025,
        currency: 'HNL',
        issuedAt: new Date('2026-04-04T10:15:00.000Z'),
        sentAt: new Date('2026-04-04T10:17:00.000Z'),
        xmlUrl: '/files/invoices/FE-2026-0001.xml',
        pdfUrl: '/files/invoices/FE-2026-0001.pdf',
        notes: 'Factura enviada automaticamente tras pago confirmado.',
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        orderId: shippedOrder.id,
        invoiceNumber: 'FE-2026-0002',
        status: 'ISSUED',
        documentType: 'FACTURA_ELECTRONICA_HN',
        series: 'SUB-2026',
        authorizationCode: 'CAI-2026-0002',
        customerName: 'Carlos Rivas',
        customerEmail: carlos.email,
        customerTaxId: '08011988001234',
        billingSnapshot: {
          businessName: 'Gym Zone',
          contactName: 'Carlos Rivas',
          taxId: '08011988001234',
          email: carlos.email,
          city: 'San Pedro Sula',
          line1: 'Colonia Trejo',
        },
        subtotal: 2520,
        tax: 0,
        total: 2520,
        currency: 'HNL',
        issuedAt: new Date('2026-04-04T11:00:00.000Z'),
        xmlUrl: '/files/invoices/FE-2026-0002.xml',
        pdfUrl: '/files/invoices/FE-2026-0002.pdf',
        notes: 'Pendiente de envio al cliente y cierre documental.',
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        orderId: deliveredOrder.id,
        invoiceNumber: 'FE-2025-0098',
        status: 'PAID',
        documentType: 'FACTURA_ELECTRONICA_HN',
        series: 'SUB-2025',
        authorizationCode: 'CAI-2025-0098',
        customerName: 'Ana Pineda',
        customerEmail: ana.email,
        customerTaxId: '08011977004567',
        billingSnapshot: {
          businessName: 'Colegio Sol',
          contactName: 'Ana Pineda',
          taxId: '08011977004567',
          email: ana.email,
          city: 'Tegucigalpa',
          line1: 'Boulevard Morazan',
        },
        subtotal: 1800,
        tax: 0,
        total: 1800,
        currency: 'HNL',
        issuedAt: new Date('2025-11-10T16:00:00.000Z'),
        sentAt: new Date('2025-11-10T16:03:00.000Z'),
        xmlUrl: '/files/invoices/FE-2025-0098.xml',
        pdfUrl: '/files/invoices/FE-2025-0098.pdf',
        notes: 'Factura historica de referencia para reactivacion.',
      },
    ],
  });

  await prisma.analyticsSnapshot.createMany({
    data: [
      {
        tenantId: DEFAULT_TENANT_ID,
        metricName: 'sales',
        window: 'DAILY',
        snapshotDate: new Date('2026-04-03'),
        dimensions: { channel: 'web' },
        values: { totalSales: 3700, orderCount: 1, averageTicket: 3700 },
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        metricName: 'sales',
        window: 'DAILY',
        snapshotDate: new Date('2026-04-04'),
        dimensions: { channel: 'whatsapp' },
        values: { totalSales: 4025, orderCount: 1, averageTicket: 4025 },
      },
    ],
  });

  const instagramCampaign = await prisma.campaign.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      ownerId: manager.id,
      name: 'Tumblers corporativos abril',
      objective: 'Generar leads para regalos corporativos con tumbler 20oz.',
      status: 'ACTIVE',
      channel: 'INSTAGRAM',
      budget: 6500,
      spent: 2480,
      approvalRequired: true,
      startAt: new Date('2026-04-01T12:00:00.000Z'),
      brief: {
        audience: 'emprendedores y pymes',
        message: 'Tumblers personalizados para equipos, regalos y activaciones.',
      },
      assets: {
        create: [
          {
            type: 'COPY',
            title: 'Copy principal abril',
            body: 'Promocion de tumblers metalicos para negocios y eventos.',
          },
        ],
      },
    },
  });

  const facebookCampaign = await prisma.campaign.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      ownerId: sales.id,
      name: 'Banners promocionales para aperturas',
      objective: 'Captar negocios que necesiten banners y piezas de apertura.',
      status: 'ACTIVE',
      channel: 'FACEBOOK',
      budget: 5200,
      spent: 1825,
      approvalRequired: true,
      startAt: new Date('2026-04-02T12:00:00.000Z'),
      brief: {
        audience: 'restaurantes, tiendas y negocios en lanzamiento',
        message: 'Banner de alto impacto con entrega guiada.',
      },
      assets: {
        create: [
          {
            type: 'IMAGE',
            title: 'Banner retail',
            mediaUrl: 'https://assets.subligo.local/campaigns/banner-retail.jpg',
          },
        ],
      },
    },
  });

  const whatsappCampaign = await prisma.campaign.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      ownerId: manager.id,
      name: 'Difusion de paquetes para negocios',
      objective: 'Promover paquetes de branding por WhatsApp con atencion guiada.',
      status: 'APPROVED',
      channel: 'WHATSAPP',
      budget: 1800,
      spent: 420,
      approvalRequired: true,
      startAt: new Date('2026-04-03T12:00:00.000Z'),
      brief: {
        audience: 'microempresas y comercios locales',
        message: 'Paquetes combinados de banner, taza y camisetas.',
      },
    },
  });

  await prisma.adPerformance.createMany({
    data: [
      {
        campaignId: instagramCampaign.id,
        date: new Date('2026-04-02T00:00:00.000Z'),
        impressions: 4100,
        clicks: 92,
        conversions: 4,
        leads: 7,
        spend: 820,
        revenue: 3240,
      },
      {
        campaignId: instagramCampaign.id,
        date: new Date('2026-04-03T00:00:00.000Z'),
        impressions: 4550,
        clicks: 104,
        conversions: 5,
        leads: 8,
        spend: 910,
        revenue: 3560,
      },
      {
        campaignId: instagramCampaign.id,
        date: new Date('2026-04-04T00:00:00.000Z'),
        impressions: 3900,
        clicks: 86,
        conversions: 3,
        leads: 6,
        spend: 750,
        revenue: 2890,
      },
      {
        campaignId: facebookCampaign.id,
        date: new Date('2026-04-02T00:00:00.000Z'),
        impressions: 5200,
        clicks: 34,
        conversions: 0,
        leads: 1,
        spend: 620,
        revenue: 0,
      },
      {
        campaignId: facebookCampaign.id,
        date: new Date('2026-04-03T00:00:00.000Z'),
        impressions: 6100,
        clicks: 39,
        conversions: 0,
        leads: 1,
        spend: 705,
        revenue: 0,
      },
      {
        campaignId: facebookCampaign.id,
        date: new Date('2026-04-04T00:00:00.000Z'),
        impressions: 4800,
        clicks: 28,
        conversions: 0,
        leads: 0,
        spend: 500,
        revenue: 0,
      },
      {
        campaignId: whatsappCampaign.id,
        date: new Date('2026-04-04T00:00:00.000Z'),
        impressions: 900,
        clicks: 58,
        conversions: 2,
        leads: 5,
        spend: 420,
        revenue: 1650,
      },
    ],
  });

  await prisma.contentCalendar.createMany({
    data: [
      {
        campaignId: instagramCampaign.id,
        createdById: manager.id,
        publishAt: new Date('2026-04-05T15:00:00.000Z'),
        channel: 'INSTAGRAM',
        status: 'APPROVED',
        topic: 'Tumbler 20oz para equipos y regalos',
        copy: 'Inspiracion de contenido aprobada para campana de tumblers.',
      },
      {
        campaignId: whatsappCampaign.id,
        createdById: manager.id,
        publishAt: new Date('2026-04-06T14:00:00.000Z'),
        channel: 'WHATSAPP',
        status: 'DRAFT',
        topic: 'Paquetes para negocios listos para cotizar',
        copy: 'Borrador base para difusion por WhatsApp.',
      },
    ],
  });

  await prisma.automation.createMany({
    data: [
      {
        createdById: manager.id,
        name: 'Reactivacion 90 dias',
        description: 'Detecta cuentas sin compra reciente y crea lead, tarea y contacto por email.',
        status: 'ACTIVE',
        triggerType: 'TIME_EVENT',
        config: {
          flow: 'reactivation-90-days',
          thresholdDays: 90,
          channel: 'EMAIL',
        },
        riskLevel: 'MEDIUM',
        approvalRequired: true,
      },
      {
        createdById: manager.id,
        name: 'Seguimiento de cotizacion 24h',
        description: 'Activa seguimiento comercial sobre leads en etapa QUOTED sin respuesta reciente.',
        status: 'ACTIVE',
        triggerType: 'LEAD_EVENT',
        config: {
          flow: 'quote-follow-up-24h',
          stage: 'QUOTED',
          delayHours: 24,
        },
        riskLevel: 'LOW',
        approvalRequired: true,
      },
      {
        createdById: manager.id,
        name: 'Carrito abandonado web',
        description: 'Recupera usuarios que dejaron productos sin completar checkout.',
        status: 'DRAFT',
        triggerType: 'ORDER_EVENT',
        config: {
          flow: 'abandoned-cart-web',
          source: 'WEB',
          delayHours: 3,
        },
        riskLevel: 'LOW',
        approvalRequired: true,
      },
      {
        createdById: manager.id,
        name: 'Solicitud de resena post-entrega',
        description: 'Solicita resena y evidencia social tras pedidos entregados.',
        status: 'ACTIVE',
        triggerType: 'ORDER_EVENT',
        config: {
          flow: 'review-request-post-delivery',
          delayDays: 3,
        },
        riskLevel: 'LOW',
        approvalRequired: true,
      },
      {
        createdById: manager.id,
        name: 'Postventa NPS',
        description: 'Dispara encuesta NPS tras entrega y clasifica riesgo de churn.',
        status: 'ACTIVE',
        triggerType: 'CUSTOMER_EVENT',
        config: {
          flow: 'post-sale-nps',
          delayDays: 7,
        },
        riskLevel: 'MEDIUM',
        approvalRequired: true,
      },
      {
        createdById: manager.id,
        name: 'Nutricion de leads frios',
        description: 'Reengancha leads con score medio o bajo mediante contenido dirigido.',
        status: 'ACTIVE',
        triggerType: 'LEAD_EVENT',
        config: {
          flow: 'cold-lead-nurture',
          stages: ['NEW', 'CONTACTED'],
          minDaysWithoutReply: 10,
        },
        riskLevel: 'LOW',
        approvalRequired: true,
      },
      {
        createdById: manager.id,
        name: 'Renovacion corporativa trimestral',
        description: 'Revisa cuentas corporativas recurrentes y propone refresh de branding.',
        status: 'PAUSED',
        triggerType: 'TIME_EVENT',
        config: {
          flow: 'quarterly-corporate-renewal',
          recurrenceDays: 90,
        },
        riskLevel: 'MEDIUM',
        approvalRequired: true,
      },
      {
        createdById: manager.id,
        name: 'Recuperacion de mensajes sin respuesta',
        description: 'Detecta conversaciones sin continuidad y sugiere siguiente accion comercial.',
        status: 'ACTIVE',
        triggerType: 'MESSAGE_EVENT',
        config: {
          flow: 'stalled-conversation-recovery',
          idleHours: 18,
        },
        riskLevel: 'MEDIUM',
        approvalRequired: true,
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: sales.id,
        orderId: orderOne.id,
        entityType: 'Lead',
        entityId: lead.id,
        action: 'lead.quoted',
        metadata: { quoteNumber: quote.quoteNumber },
      },
      {
        actorUserId: admin.id,
        orderId: orderOne.id,
        entityType: 'Order',
        entityId: orderOne.id,
        action: 'order.promoted_to_production',
        metadata: { orderNumber: orderOne.orderNumber },
      },
    ],
  });

  await prisma.task.create({
    data: {
      orderId: orderOne.id,
      leadId: lead.id,
      createdById: manager.id,
      assignedToId: admin.id,
      title: 'Validar color de lote de tazas',
      description: 'Comparar muestra contra aprobacion del cliente.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
    },
  });

  await prisma.task.create({
    data: {
      orderId: orderOne.id,
      createdById: manager.id,
      assignedToId: sales.id,
      title: 'Confirmar aprobacion final del banner premium',
      description: 'Cliente solicito validar color y contraste antes del despacho.',
      status: 'BLOCKED',
      priority: 'CRITICAL',
      dueDate: new Date('2026-04-04T18:00:00.000Z'),
    },
  });

  await prisma.task.create({
    data: {
      orderId: shippedOrder.id,
      createdById: manager.id,
      assignedToId: admin.id,
      title: 'Monitorear entrega nacional',
      description: 'Verificar tracking y confirmar recepcion con el cliente.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: new Date('2026-04-06T18:00:00.000Z'),
    },
  });

  await prisma.customer.update({
    where: { id: ana.id },
    data: {
      notes: 'Cliente con historico escolar, sin compra reciente y listo para flujo de reactivacion.',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
