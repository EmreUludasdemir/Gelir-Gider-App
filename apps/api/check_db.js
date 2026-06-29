require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const uploads = await prisma.pdfUpload.findMany({
    select: {
      id: true,
      filename: true,
      fileHash: true,
      fileSize: true,
    }
  });
  console.log(uploads);
}

main().finally(() => prisma.$disconnect());
