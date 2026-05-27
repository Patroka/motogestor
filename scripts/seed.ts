import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedAdminPass = await bcrypt.hash('admin123', 12);
  await prisma.adminUser.upsert({
    where: { email: 'admin@motogestor.com' },
    update: {},
    create: {
      id: 'admin1',
      name: 'Administrador',
      email: 'admin@motogestor.com',
      hashedPassword: hashedAdminPass,
    },
  });

  const now30 = new Date();
  now30.setDate(now30.getDate() + 30);
  const overdue5 = new Date();
  overdue5.setDate(overdue5.getDate() - 5);
  const lastPay = new Date();
  lastPay.setDate(lastPay.getDate() - 25);

  // Create shops
  const shop1 = await prisma.shop.upsert({
    where: { id: 'shop1' },
    update: { ownerName: 'João Admin', plan: 'Profissional', planValue: 149.90, status: 'Ativo', dueDate: now30, lastPayment: lastPay },
    create: {
      id: 'shop1',
      name: 'Moto Center Express',
      ownerName: 'João Admin',
      phone: '11999887766',
      address: 'Rua das Oficinas, 123 - São Paulo/SP',
      plan: 'Profissional',
      planValue: 149.90,
      status: 'Ativo',
      dueDate: now30,
      lastPayment: lastPay,
    },
  });

  const shop2 = await prisma.shop.upsert({
    where: { id: 'shop2' },
    update: { ownerName: 'Carlos Silva', plan: 'Profissional', planValue: 149.90, status: 'Atrasado', dueDate: overdue5, lastPayment: new Date(Date.now() - 35 * 86400000) },
    create: {
      id: 'shop2',
      name: 'Oficina Duas Rodas',
      ownerName: 'Carlos Silva',
      phone: '21988776655',
      address: 'Av. Brasil, 456 - Rio de Janeiro/RJ',
      plan: 'Profissional',
      planValue: 149.90,
      status: 'Atrasado',
      dueDate: overdue5,
      lastPayment: new Date(Date.now() - 35 * 86400000),
    },
  });

  const shop3 = await prisma.shop.upsert({
    where: { id: 'shop3' },
    update: { ownerName: 'Marcos Oliveira', plan: 'Premium', planValue: 249.90, status: 'Ativo', dueDate: new Date(Date.now() + 20 * 86400000), lastPayment: new Date(Date.now() - 10 * 86400000) },
    create: {
      id: 'shop3',
      name: 'Speed Motos Serviços',
      ownerName: 'Marcos Oliveira',
      phone: '31977665544',
      address: 'Rua Minas Gerais, 789 - Belo Horizonte/MG',
      plan: 'Premium',
      planValue: 249.90,
      status: 'Ativo',
      dueDate: new Date(Date.now() + 20 * 86400000),
      lastPayment: new Date(Date.now() - 10 * 86400000),
    },
  });

  // Create users
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  const hashedDemo = await bcrypt.hash('demo123', 12);

  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      name: 'João Admin',
      email: 'john@doe.com',
      hashedPassword,
      role: 'admin',
      shopId: shop1.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'carlos@duasrodas.com' },
    update: {},
    create: {
      name: 'Carlos Silva',
      email: 'carlos@duasrodas.com',
      hashedPassword: hashedDemo,
      role: 'admin',
      shopId: shop2.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'marcos@speedmotos.com' },
    update: {},
    create: {
      name: 'Marcos Oliveira',
      email: 'marcos@speedmotos.com',
      hashedPassword: hashedDemo,
      role: 'admin',
      shopId: shop3.id,
    },
  });

  // Create customers for shop1
  const customers = [
    { id: 'c1', name: 'Ricardo Mendes', phone: '11998765432', motorcycle: 'Honda', model: 'CG 160 Titan', plate: 'ABC-1234', observations: 'Cliente fiel desde 2022', shopId: shop1.id },
    { id: 'c2', name: 'Ana Paula Santos', phone: '11987654321', motorcycle: 'Yamaha', model: 'Fazer 250', plate: 'DEF-5678', observations: 'Prefere atendimento pela manhã', shopId: shop1.id },
    { id: 'c3', name: 'Fernando Costa', phone: '11976543210', motorcycle: 'Honda', model: 'CB 300F', plate: 'GHI-9012', observations: null, shopId: shop1.id },
    { id: 'c4', name: 'Juliana Ferreira', phone: '11965432109', motorcycle: 'Honda', model: 'Biz 125', plate: 'JKL-3456', observations: 'Usa a moto para delivery', shopId: shop1.id },
    { id: 'c5', name: 'Pedro Almeida', phone: '11954321098', motorcycle: 'Yamaha', model: 'MT-03', plate: 'MNO-7890', observations: 'Gosta de peças originais', shopId: shop1.id },
    { id: 'c6', name: 'Maria Souza', phone: '11943210987', motorcycle: 'Honda', model: 'Pop 110i', plate: 'PQR-1234', observations: null, shopId: shop1.id },
    { id: 'c7', name: 'Lucas Rodrigues', phone: '21998887776', motorcycle: 'Honda', model: 'NXR 160 Bros', plate: 'STU-5678', observations: null, shopId: shop2.id },
    { id: 'c8', name: 'Camila Oliveira', phone: '21987776665', motorcycle: 'Yamaha', model: 'NMAX 160', plate: 'VWX-9012', observations: 'Cliente novo', shopId: shop2.id },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  // Create products for shop1
  const products = [
    { id: 'p1', name: 'Óleo Motor 10W30 Motul', category: 'Óleo e Lubrificantes', quantity: 25, minQuantity: 10, costPrice: 28.00, salePrice: 45.00, shopId: shop1.id },
    { id: 'p2', name: 'Filtro de Óleo Honda CG', category: 'Filtros', quantity: 15, minQuantity: 5, costPrice: 12.00, salePrice: 25.00, shopId: shop1.id },
    { id: 'p3', name: 'Pastilha de Freio Dianteira', category: 'Freios', quantity: 8, minQuantity: 5, costPrice: 18.00, salePrice: 35.00, shopId: shop1.id },
    { id: 'p4', name: 'Vela de Ignição NGK', category: 'Motor', quantity: 20, minQuantity: 8, costPrice: 15.00, salePrice: 30.00, shopId: shop1.id },
    { id: 'p5', name: 'Kit Relção Completo CG 160', category: 'Transmissão', quantity: 3, minQuantity: 3, costPrice: 85.00, salePrice: 150.00, shopId: shop1.id },
    { id: 'p6', name: 'Cabo de Acelerador CG', category: 'Acessórios', quantity: 6, minQuantity: 3, costPrice: 8.00, salePrice: 20.00, shopId: shop1.id },
    { id: 'p7', name: 'Lâmpada Farol LED H4', category: 'Elétrica', quantity: 2, minQuantity: 5, costPrice: 35.00, salePrice: 65.00, shopId: shop1.id },
    { id: 'p8', name: 'Pneu Traseiro 90/90-18', category: 'Pneus', quantity: 4, minQuantity: 3, costPrice: 120.00, salePrice: 200.00, shopId: shop1.id },
    { id: 'p9', name: 'Corrente de Transmissão 428H', category: 'Transmissão', quantity: 5, minQuantity: 3, costPrice: 45.00, salePrice: 80.00, shopId: shop1.id },
    { id: 'p10', name: 'Fluido de Freio DOT4', category: 'Freios', quantity: 10, minQuantity: 5, costPrice: 18.00, salePrice: 35.00, shopId: shop1.id },
    { id: 'p11', name: 'Retrovisor Universal', category: 'Acessórios', quantity: 1, minQuantity: 4, costPrice: 22.00, salePrice: 45.00, shopId: shop1.id },
    { id: 'p12', name: 'Amortecedor Traseiro Pro-Link', category: 'Suspensão', quantity: 2, minQuantity: 2, costPrice: 150.00, salePrice: 280.00, shopId: shop1.id },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }

  // Create service orders for shop1
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(now); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const threeDaysAgo = new Date(now); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(now); dayAfter.setDate(dayAfter.getDate() + 2);

  const orders = [
    {
      id: 'o1', orderNumber: 1, customerId: 'c1', motorcycle: 'Honda', model: 'CG 160 Titan', plate: 'ABC-1234',
      description: 'Troca de óleo e filtro, revisão geral dos freios', partsUsed: 'Óleo 10W30, Filtro de óleo',
      laborCost: 80, partsCost: 70, discount: 0, totalCost: 150, status: 'Entregue',
      paymentMethod: 'Pix', entryDate: threeDaysAgo, estimatedDate: twoDaysAgo, completedDate: twoDaysAgo, shopId: shop1.id,
    },
    {
      id: 'o2', orderNumber: 2, customerId: 'c2', motorcycle: 'Yamaha', model: 'Fazer 250', plate: 'DEF-5678',
      description: 'Troca kit relação completo e regulagem de corrente', partsUsed: 'Kit Relação Completo',
      laborCost: 120, partsCost: 150, discount: 20, totalCost: 250, status: 'Entregue',
      paymentMethod: 'Cartão', entryDate: twoDaysAgo, estimatedDate: yesterday, completedDate: yesterday, shopId: shop1.id,
    },
    {
      id: 'o3', orderNumber: 3, customerId: 'c3', motorcycle: 'Honda', model: 'CB 300F', plate: 'GHI-9012',
      description: 'Troca pastilhas de freio dianteira e traseira, sangria do sistema', partsUsed: 'Pastilhas de freio, Fluido DOT4',
      laborCost: 100, partsCost: 105, discount: 0, totalCost: 205, status: 'Pronta para retirada',
      paymentMethod: null, entryDate: yesterday, estimatedDate: now, completedDate: null, shopId: shop1.id,
    },
    {
      id: 'o4', orderNumber: 4, customerId: 'c4', motorcycle: 'Honda', model: 'Biz 125', plate: 'JKL-3456',
      description: 'Motor falhando, diagnóstico e troca de vela de ignição', partsUsed: 'Vela NGK',
      laborCost: 60, partsCost: 30, discount: 0, totalCost: 90, status: 'Em manutenção',
      paymentMethod: null, entryDate: yesterday, estimatedDate: tomorrow, completedDate: null, shopId: shop1.id,
    },
    {
      id: 'o5', orderNumber: 5, customerId: 'c5', motorcycle: 'Yamaha', model: 'MT-03', plate: 'MNO-7890',
      description: 'Revisão completa 10.000km: óleo, filtros, corrente, freios', partsUsed: null,
      laborCost: 200, partsCost: 0, discount: 0, totalCost: 200, status: 'Aguardando aprovação',
      paymentMethod: null, entryDate: now, estimatedDate: dayAfter, completedDate: null, shopId: shop1.id,
    },
    {
      id: 'o6', orderNumber: 6, customerId: 'c6', motorcycle: 'Honda', model: 'Pop 110i', plate: 'PQR-1234',
      description: 'Troca de lâmpada do farol e ajuste do farol', partsUsed: null,
      laborCost: 40, partsCost: 65, discount: 5, totalCost: 100, status: 'Em análise',
      paymentMethod: null, entryDate: now, estimatedDate: tomorrow, completedDate: null, shopId: shop1.id,
    },
    {
      id: 'o7', orderNumber: 7, customerId: 'c1', motorcycle: 'Honda', model: 'CG 160 Titan', plate: 'ABC-1234',
      description: 'Troca de pneu traseiro', partsUsed: 'Pneu 90/90-18',
      laborCost: 50, partsCost: 200, discount: 0, totalCost: 250, status: 'Recebida',
      paymentMethod: null, entryDate: now, estimatedDate: tomorrow, completedDate: null, shopId: shop1.id,
    },
  ];

  for (const o of orders) {
    await prisma.serviceOrder.upsert({
      where: { id: o.id },
      update: {},
      create: o,
    });
  }

  // Create a cash session for shop1
  const cashSession = await prisma.cashSession.upsert({
    where: { id: 'cs1' },
    update: {},
    create: {
      id: 'cs1',
      openingAmount: 200,
      status: 'open',
      shopId: shop1.id,
    },
  });

  // Create cash movements
  const movements = [
    { id: 'cm1', type: 'entrada', amount: 150, description: 'OS #1 - Troca óleo Ricardo Mendes', paymentMethod: 'Pix', cashSessionId: cashSession.id, shopId: shop1.id },
    { id: 'cm2', type: 'entrada', amount: 250, description: 'OS #2 - Kit relação Ana Paula', paymentMethod: 'Cartão', cashSessionId: cashSession.id, shopId: shop1.id },
    { id: 'cm3', type: 'saida', amount: 85, description: 'Compra de peças - fornecedor', paymentMethod: 'Dinheiro', cashSessionId: cashSession.id, shopId: shop1.id },
    { id: 'cm4', type: 'saida', amount: 45, description: 'Material de limpeza', paymentMethod: 'Pix', cashSessionId: cashSession.id, shopId: shop1.id },
    { id: 'cm5', type: 'entrada', amount: 90, description: 'Serviço avulso - ajuste corrente', paymentMethod: 'Dinheiro', cashSessionId: cashSession.id, shopId: shop1.id },
  ];

  for (const m of movements) {
    await prisma.cashMovement.upsert({
      where: { id: m.id },
      update: {},
      create: m,
    });
  }

  // Closed session for history
  const closedDate = new Date(now);
  closedDate.setDate(closedDate.getDate() - 1);
  await prisma.cashSession.upsert({
    where: { id: 'cs_closed1' },
    update: {},
    create: {
      id: 'cs_closed1',
      openingAmount: 150,
      closingAmount: 520,
      expectedAmount: 515,
      difference: 5,
      status: 'closed',
      openedAt: twoDaysAgo,
      closedAt: closedDate,
      shopId: shop1.id,
    },
  });

  // Create payment history for shops
  const payments = [
    { id: 'pay1', shopId: shop1.id, amount: 149.90, status: 'Pago', method: 'Pix', paidAt: lastPay, dueDate: new Date(Date.now() - 5 * 86400000) },
    { id: 'pay2', shopId: shop1.id, amount: 149.90, status: 'Pago', method: 'Cartão', paidAt: new Date(Date.now() - 55 * 86400000), dueDate: new Date(Date.now() - 35 * 86400000) },
    { id: 'pay3', shopId: shop2.id, amount: 99.90, status: 'Pago', method: 'Pix', paidAt: new Date(Date.now() - 35 * 86400000), dueDate: new Date(Date.now() - 35 * 86400000) },
    { id: 'pay4', shopId: shop3.id, amount: 249.90, status: 'Pago', method: 'Transferência', paidAt: new Date(Date.now() - 10 * 86400000), dueDate: new Date(Date.now() - 10 * 86400000) },
  ];

  for (const p of payments) {
    await prisma.paymentHistory.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }

  // Activity logs
  const logs = [
    { id: 'log1', shopId: shop1.id, action: 'Criação', description: 'Oficina "Moto Center Express" criada com plano Profissional' },
    { id: 'log2', shopId: shop1.id, action: 'Pagamento', description: 'Pagamento de R$ 149,90 registrado via Pix' },
    { id: 'log3', shopId: shop2.id, action: 'Criação', description: 'Oficina "Oficina Duas Rodas" criada com plano Profissional' },
    { id: 'log4', shopId: shop2.id, action: 'Atraso', description: 'Pagamento marcado como atrasado' },
    { id: 'log5', shopId: shop3.id, action: 'Criação', description: 'Oficina "Speed Motos" criada com plano Premium' },
    { id: 'log6', shopId: shop3.id, action: 'Pagamento', description: 'Pagamento de R$ 249,90 registrado via Transferência' },
  ];

  for (const l of logs) {
    await prisma.activityLog.upsert({
      where: { id: l.id },
      update: {},
      create: l,
    });
  }

  // System config
  const configs = [
    { key: 'systemName', value: 'MotoGestor Pro' },
    { key: 'planProfissional', value: '149.90' },
    { key: 'planPremium', value: '249.90' },
  ];

  for (const c of configs) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      update: { value: c.value },
      create: c,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
