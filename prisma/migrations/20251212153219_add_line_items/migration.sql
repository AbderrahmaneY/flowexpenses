-- CreateTable
CREATE TABLE "ExpenseLineItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "expenseReportId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dateOfExpense" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseLineItem_expenseReportId_fkey" FOREIGN KEY ("expenseReportId") REFERENCES "ExpenseReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExpenseReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" REAL NOT NULL DEFAULT 0,
    "dateOfExpense" DATETIME NOT NULL,
    "currentStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExpenseReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ExpenseReport" ("amount", "category", "createdAt", "currency", "currentStatus", "dateOfExpense", "description", "id", "title", "updatedAt", "userId") SELECT "amount", "category", "createdAt", "currency", "currentStatus", "dateOfExpense", "description", "id", "title", "updatedAt", "userId" FROM "ExpenseReport";
DROP TABLE "ExpenseReport";
ALTER TABLE "new_ExpenseReport" RENAME TO "ExpenseReport";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
