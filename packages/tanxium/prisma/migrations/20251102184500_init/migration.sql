-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT "{}",
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkspaceConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "smtpPort" INTEGER,
    "smtpUsername" TEXT,
    "smtpPassword" TEXT,
    "metadata" JSONB NOT NULL DEFAULT "{}",
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT NOT NULL,
    CONSTRAINT "WorkspaceConfiguration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RestEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT "{}",
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT NOT NULL,
    CONSTRAINT "RestEntity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceConfiguration_workspaceId_key" ON "WorkspaceConfiguration"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceConfiguration_workspaceId_idx" ON "WorkspaceConfiguration"("workspaceId");

-- CreateIndex
CREATE INDEX "RestEntity_workspaceId_idx" ON "RestEntity"("workspaceId");
