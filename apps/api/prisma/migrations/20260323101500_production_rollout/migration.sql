-- AlterTable
ALTER TABLE "BankConnection"
ADD COLUMN "oauthState" TEXT,
ADD COLUMN "lifecycleState" TEXT NOT NULL DEFAULT 'pending_consent',
ADD COLUMN "providerConnectionId" TEXT,
ADD COLUMN "providerErrorCode" TEXT,
ADD COLUMN "providerErrorMessage" TEXT,
ADD COLUMN "connectionMetadata" TEXT,
ADD COLUMN "lastConsentAt" TIMESTAMP(3),
ADD COLUMN "reauthRequiredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Transaction"
ADD COLUMN "householdId" TEXT,
ADD COLUMN "ownerUserId" TEXT,
ADD COLUMN "reviewerUserId" TEXT,
ADD COLUMN "needsReview" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "HouseholdInvite"
ADD COLUMN "role" TEXT NOT NULL DEFAULT 'member';

-- CreateTable
CREATE TABLE "SubscriptionDetectionFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detectedSubscriptionId" TEXT,
    "reasonCodes" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionDetectionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsActionOutcome" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsActionOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_householdId_idx" ON "Transaction"("householdId");

-- CreateIndex
CREATE INDEX "Transaction_needsReview_idx" ON "Transaction"("needsReview");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionDetectionFeedback_userId_fingerprint_key" ON "SubscriptionDetectionFeedback"("userId", "fingerprint");

-- CreateIndex
CREATE INDEX "SubscriptionDetectionFeedback_userId_idx" ON "SubscriptionDetectionFeedback"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionDetectionFeedback_status_idx" ON "SubscriptionDetectionFeedback"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SavingsActionOutcome_userId_actionId_key" ON "SavingsActionOutcome"("userId", "actionId");

-- CreateIndex
CREATE INDEX "SavingsActionOutcome_userId_idx" ON "SavingsActionOutcome"("userId");

-- CreateIndex
CREATE INDEX "SavingsActionOutcome_status_idx" ON "SavingsActionOutcome"("status");

-- AddForeignKey
ALTER TABLE "SubscriptionDetectionFeedback" ADD CONSTRAINT "SubscriptionDetectionFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsActionOutcome" ADD CONSTRAINT "SavingsActionOutcome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
