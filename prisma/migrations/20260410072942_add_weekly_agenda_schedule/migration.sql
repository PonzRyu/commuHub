-- CreateTable
CREATE TABLE "WeeklyAgendaSchedule" (
    "id" TEXT NOT NULL,
    "weekMondayYmd" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyAgendaSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyAgendaSchedule_weekMondayYmd_key" ON "WeeklyAgendaSchedule"("weekMondayYmd");
