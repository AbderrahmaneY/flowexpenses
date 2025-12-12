import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Verifying data...');
    const users = await prisma.user.count();
    const rules = await prisma.ruleConfig.count();
    const expenses = await prisma.expenseReport.count();

    console.log(`Users: ${users} (Expected: 4)`);
    console.log(`Rules: ${rules} (Expected: 3)`);
    console.log(`Expenses: ${expenses} (Expected: 1)`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
