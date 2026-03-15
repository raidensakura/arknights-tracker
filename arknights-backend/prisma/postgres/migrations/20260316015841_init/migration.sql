-- CreateTable
CREATE TABLE "User" (
    "uid" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "UserBannerStat" (
    "uid" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "totalPulls" INTEGER NOT NULL DEFAULT 0,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total6" INTEGER NOT NULL DEFAULT 0,
    "sumPity6" INTEGER NOT NULL DEFAULT 0,
    "total5" INTEGER NOT NULL DEFAULT 0,
    "sumPity5" INTEGER NOT NULL DEFAULT 0,
    "won5050" INTEGER NOT NULL DEFAULT 0,
    "total5050" INTEGER NOT NULL DEFAULT 0,
    "lastProcessedPullTime" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "UserBannerStat_pkey" PRIMARY KEY ("uid","bannerId")
);

-- CreateTable
CREATE TABLE "ImportError" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "stack" TEXT,
    "serverId" TEXT,
    "solved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ImportError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalBannerStats" (
    "bannerId" TEXT NOT NULL,
    "totalPulls" BIGINT NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "total6" INTEGER NOT NULL DEFAULT 0,
    "total5" INTEGER NOT NULL DEFAULT 0,
    "limitedCount" INTEGER NOT NULL DEFAULT 0,
    "lost5050" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalBannerStats_pkey" PRIMARY KEY ("bannerId")
);

-- CreateTable
CREATE TABLE "GlobalTimeline" (
    "bannerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "pulls" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GlobalTimeline_pkey" PRIMARY KEY ("bannerId","date")
);

-- CreateTable
CREATE TABLE "GlobalPityDistribution" (
    "bannerId" TEXT NOT NULL,
    "pity" INTEGER NOT NULL,
    "rarity" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GlobalPityDistribution_pkey" PRIMARY KEY ("bannerId","rarity","pity")
);

-- CreateTable
CREATE TABLE "GlobalItemStats" (
    "bannerId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "rarity" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GlobalItemStats_pkey" PRIMARY KEY ("bannerId","itemName")
);

-- CreateIndex
CREATE INDEX "UserBannerStat_bannerId_totalPulls_idx" ON "UserBannerStat"("bannerId", "totalPulls");

-- CreateIndex
CREATE INDEX "UserBannerStat_bannerId_sumPity6_idx" ON "UserBannerStat"("bannerId", "sumPity6");

-- AddForeignKey
ALTER TABLE "UserBannerStat" ADD CONSTRAINT "UserBannerStat_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;


