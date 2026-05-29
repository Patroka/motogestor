import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const raw = await prisma.$queryRaw<any[]>`SELECT * FROM "Customer"`;

  for (const customer of raw) {
    const needsMigration =
      customer.nome !== undefined ||
      customer.telefone !== undefined ||
      customer.motocicleta !== undefined;

    if (needsMigration) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: customer.nome || customer.name || "",
          phone: customer.telefone || customer.phone || "",
          motorcycle: customer.motocicleta || customer.motorcycle || "",
          model: customer.modelo || customer.model || "",
          plate: customer.placa || customer.plate || "",
          observations: customer.observações || customer.observations || "",
        },
      });
      console.log(`Migrado: ${customer.nome || customer.name}`);
    }
  }
  console.log("Migração concluída!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
