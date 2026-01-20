import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'production';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    let reportData: any = {};

    switch (reportType) {
      case 'production': {
        // Get egg collection data with date filter
        const eggCollections = await prisma.dailyEggCollection.findMany({
          where: {
            collectionDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
          },
          include: {
            flock: {
              include: {
                site: true,
              },
            },
          },
          orderBy: { collectionDate: 'desc' },
        });

        // Calculate totals
        const totalEggs = eggCollections.reduce((sum: number, collection: any) => {
          return sum + collection.totalEggsCount;
        }, 0);

        const totalGoodEggs = eggCollections.reduce((sum: number, collection: any) => sum + collection.goodEggsCount, 0);
        const totalBrokenEggs = eggCollections.reduce((sum: number, collection: any) => sum + collection.brokenEggsCount, 0);

        // Calculate average production rate
        const avgProductionRate = eggCollections.length > 0
          ? eggCollections.reduce((sum: number, collection: any) => sum + Number(collection.productionPercentage || 0), 0) / eggCollections.length
          : 0;

        // Group by flock
        const byFlock = eggCollections.reduce((acc: any, collection: any) => {
          const flockId = collection.flockId;
          if (!acc[flockId]) {
            acc[flockId] = {
              flockName: collection.flock.flockName,
              siteName: collection.flock.site.name,
              totalEggs: 0,
              goodEggs: 0,
              brokenEggs: 0,
              collections: 0,
            };
          }
          acc[flockId].totalEggs += collection.totalEggsCount;
          acc[flockId].goodEggs += collection.goodEggsCount;
          acc[flockId].brokenEggs += collection.brokenEggsCount;
          acc[flockId].collections += 1;
          return acc;
        }, {});

        reportData = {
          summary: {
            totalEggs,
            totalGoodEggs,
            totalBrokenEggs,
            avgProductionRate: Math.round(avgProductionRate * 10) / 10,
            totalCollections: eggCollections.length,
          },
          byFlock: Object.values(byFlock),
          collections: eggCollections.map((collection: any) => ({
            id: collection.id,
            date: collection.collectionDate,
            flockName: collection.flock.flockName,
            siteName: collection.flock.site.name,
            goodEggs: collection.goodEggsCount,
            brokenEggs: collection.brokenEggsCount,
            totalEggs: collection.totalEggsCount,
            productionPercentage: Number(collection.productionPercentage || 0),
          })),
        };
        break;
      }

      case 'mortality': {
        // Get mortality records with date filter
        const mortalityRecords = await prisma.mortalityRecord.findMany({
          where: {
            mortalityDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
          },
          include: {
            flock: {
              include: {
                site: true,
              },
            },
            batch: {
              include: {
                site: true,
              },
            },
          },
          orderBy: { mortalityDate: 'desc' },
        });

        // Calculate totals
        const totalDeaths = mortalityRecords.reduce((sum: number, record: any) => sum + record.mortalityCount, 0);

        // Group by cause
        const byCause = mortalityRecords.reduce((acc: any, record: any) => {
          const cause = record.cause || 'Unknown';
          if (!acc[cause]) {
            acc[cause] = { cause, count: 0, records: 0 };
          }
          acc[cause].count += record.mortalityCount;
          acc[cause].records += 1;
          return acc;
        }, {});

        // Group by flock/batch
        const byGroup = mortalityRecords.reduce((acc: any, record: any) => {
          const groupId = record.flockId || record.batchId || 'unknown';
          const groupName = record.flock?.flockName || record.batch?.batchName || 'Unknown';
          const siteName = record.flock?.site.name || record.batch?.site.name || 'Unknown';
          const type = record.flockId ? 'Layer Flock' : 'Broiler Batch';

          if (!acc[groupId]) {
            acc[groupId] = {
              groupName,
              siteName,
              type,
              totalDeaths: 0,
              records: 0,
            };
          }
          acc[groupId].totalDeaths += record.mortalityCount;
          acc[groupId].records += 1;
          return acc;
        }, {});

        reportData = {
          summary: {
            totalDeaths,
            totalRecords: mortalityRecords.length,
            avgDeathsPerRecord: mortalityRecords.length > 0 ? Math.round((totalDeaths / mortalityRecords.length) * 10) / 10 : 0,
          },
          byCause: Object.values(byCause),
          byGroup: Object.values(byGroup),
          records: mortalityRecords.map((record: any) => ({
            id: record.id,
            date: record.mortalityDate,
            type: record.flockId ? 'Layer Flock' : 'Broiler Batch',
            groupName: record.flock?.flockName || record.batch?.batchName || 'Unknown',
            siteName: record.flock?.site.name || record.batch?.site.name || 'Unknown',
            count: record.mortalityCount,
            cause: record.cause || 'Unknown',
            notes: record.notes,
          })),
        };
        break;
      }

      case 'inventory': {
        // Get current inventory
        const flocks = await prisma.flock.findMany({
          where: { status: 'active' },
          include: {
            site: true,
          },
        });

        const batches = await prisma.batch.findMany({
          where: { status: 'active' },
          include: {
            site: true,
          },
        });

        const totalLayers = flocks.reduce((sum: number, flock: any) => sum + flock.currentStock, 0);
        const totalBroilers = batches.reduce((sum: number, batch: any) => sum + batch.currentStock, 0);
        const totalBirds = totalLayers + totalBroilers;

        reportData = {
          summary: {
            totalBirds,
            totalLayers,
            totalBroilers,
            activeFlocks: flocks.length,
            activeBatches: batches.length,
          },
          flocks: flocks.map((flock: any) => ({
            id: flock.id,
            name: flock.flockName,
            siteName: flock.site.name,
            breed: flock.breed,
            ageWeeks: Math.floor(
              (new Date().getTime() - new Date(flock.arrivalDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
            ),
            initialStock: flock.openingStock,
            currentStock: flock.currentStock,
            mortalityRate: ((flock.openingStock - flock.currentStock) / flock.openingStock * 100).toFixed(2),
          })),
          batches: batches.map((batch: any) => ({
            id: batch.id,
            name: batch.batchName,
            siteName: batch.site.name,
            breed: batch.breed,
            ageWeeks: Math.floor(
              (new Date().getTime() - new Date(batch.docArrivalDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
            ),
            initialStock: batch.quantityReceived,
            currentStock: batch.currentStock,
            mortalityRate: ((batch.quantityReceived - batch.currentStock) / batch.quantityReceived * 100).toFixed(2),
          })),
        };
        break;
      }

      case 'weight': {
        // Get weight tracking records with date filter
        const weightRecords = await prisma.weightRecord.findMany({
          where: {
            weighingDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
          },
          include: {
            batch: {
              include: {
                site: true,
              },
            },
          },
          orderBy: { weighingDate: 'desc' },
        });

        // Calculate averages
        const avgWeight = weightRecords.length > 0
          ? weightRecords.reduce((sum: number, record: any) => sum + Number(record.averageWeight), 0) / weightRecords.length
          : 0;

        // Group by batch
        const byBatch = weightRecords.reduce((acc: any, record: any) => {
          const batchId = record.batchId;
          if (!acc[batchId]) {
            acc[batchId] = {
              batchName: record.batch.batchName,
              siteName: record.batch.site.name,
              records: 0,
              avgWeight: 0,
              totalSampled: 0,
            };
          }
          acc[batchId].records += 1;
          acc[batchId].totalSampled += record.sampleSize;
          return acc;
        }, {});

        // Calculate average weight for each batch
        Object.keys(byBatch).forEach((batchId: any) => {
          const batchRecords = weightRecords.filter((r: any) => r.batchId === batchId);
          const totalWeight = batchRecords.reduce((sum: number, r: any) => sum + Number(r.averageWeight), 0);
          byBatch[batchId].avgWeight = batchRecords.length > 0
            ? Math.round((totalWeight / batchRecords.length) * 100) / 100
            : 0;
        });

        reportData = {
          summary: {
            avgWeight: Math.round(avgWeight * 100) / 100,
            totalRecords: weightRecords.length,
            totalSampled: weightRecords.reduce((sum: number, record: any) => sum + record.sampleSize, 0),
          },
          byBatch: Object.values(byBatch),
          records: weightRecords.map((record: any) => ({
            id: record.id,
            date: record.weighingDate,
            batchName: record.batch.batchName,
            siteName: record.batch.site.name,
            sampleSize: record.sampleSize,
            averageWeight: Number(record.averageWeight),
            notes: record.notes,
          })),
        };
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({
      type: reportType,
      startDate,
      endDate,
      data: reportData,
    });
  } catch (error) {
    console.error('Reports API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
