import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

// GET - Calculate FCR for batches
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    // Get batch details
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        batchName: true,
        docArrivalDate: true,
        quantityReceived: true,
        currentStock: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Get all feed consumption records
    const feedRecords = await prisma.dailyFeedConsumption.findMany({
      where: { batchId },
      orderBy: { consumptionDate: 'asc' },
    });

    // Calculate total feed consumed (convert bags to kg, assuming 25kg per bag)
    const totalFeedKg = feedRecords.reduce((sum: number, record: any) => {
      return sum + (Number(record.feedQuantityBags) * 25);
    }, 0);

    const totalFeedCost = feedRecords.reduce((sum: number, record: any) => {
      return sum + Number(record.totalFeedCost);
    }, 0);

    // Get all weight records
    const weightRecords = await prisma.weightRecord.findMany({
      where: { batchId },
      orderBy: { weighingDate: 'asc' },
    });

    // Calculate weight gain
    let initialWeight = 0.045; // Assuming average DOC weight is 45g = 0.045kg
    let currentWeight = initialWeight;
    let weightGain = 0;

    if (weightRecords.length > 0) {
      // Use the most recent weight record
      const latestWeight = weightRecords[weightRecords.length - 1];
      currentWeight = Number(latestWeight.averageWeight);
      weightGain = currentWeight - initialWeight;
    }

    // Calculate total weight gain for all birds
    const totalWeightGain = weightGain * batch.currentStock;

    // Calculate FCR
    let fcr = 0;
    if (totalWeightGain > 0) {
      fcr = totalFeedKg / totalWeightGain;
    }

    // Calculate cost per kg
    let costPerKg = 0;
    if (totalWeightGain > 0) {
      costPerKg = totalFeedCost / totalWeightGain;
    }

    // Calculate age in days
    const today = new Date();
    const arrivalDate = new Date(batch.docArrivalDate);
    const ageInDays = Math.floor(
      (today.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get mortality count
    const mortalityRecords = await prisma.mortalityRecord.findMany({
      where: { batchId },
    });

    const totalMortality = mortalityRecords.reduce((sum: number, record: any) => {
      return sum + record.mortalityCount;
    }, 0);

    // Calculate daily weight gain per bird
    let dailyWeightGain = 0;
    if (ageInDays > 0) {
      dailyWeightGain = (weightGain * 1000) / ageInDays; // in grams
    }

    // Get FCR trend over time
    const fcrTrend = weightRecords.map((weightRecord: any, index: number) => {
      // Calculate cumulative feed up to this weight record
      const feedUpToDate = feedRecords
        .filter(f => new Date(f.consumptionDate) <= new Date(weightRecord.weighingDate))
        .reduce((sum: number, record: any) => sum + (Number(record.feedQuantityBags) * 25), 0);

      // Calculate weight gain at this point
      const weightAtPoint = Number(weightRecord.averageWeight);
      const gainAtPoint = weightAtPoint - initialWeight;
      const totalGainAtPoint = gainAtPoint * batch.currentStock;

      // Calculate FCR at this point
      const fcrAtPoint = totalGainAtPoint > 0 ? feedUpToDate / totalGainAtPoint : 0;

      return {
        date: weightRecord.weighingDate,
        ageInDays: weightRecord.ageInDays,
        averageWeight: Number(weightRecord.averageWeight),
        fcr: Number(fcrAtPoint.toFixed(2)),
      };
    });

    // Industry benchmarks (typical for broilers)
    const benchmarks = {
      excellent: 1.6,
      good: 1.8,
      average: 2.0,
      poor: 2.2,
    };

    let performance = 'Not enough data';
    if (fcr > 0) {
      if (fcr <= benchmarks.excellent) performance = 'Excellent';
      else if (fcr <= benchmarks.good) performance = 'Good';
      else if (fcr <= benchmarks.average) performance = 'Average';
      else if (fcr <= benchmarks.poor) performance = 'Below Average';
      else performance = 'Poor';
    }

    return NextResponse.json({
      batch: {
        id: batch.id,
        batchName: batch.batchName,
        ageInDays,
        initialStock: batch.quantityReceived,
        currentStock: batch.currentStock,
        mortality: totalMortality,
      },
      metrics: {
        totalFeedConsumed: Number(totalFeedKg.toFixed(2)),
        totalFeedCost: Number(totalFeedCost.toFixed(2)),
        initialWeight: Number(initialWeight.toFixed(3)),
        currentWeight: Number(currentWeight.toFixed(3)),
        weightGain: Number(weightGain.toFixed(3)),
        totalWeightGain: Number(totalWeightGain.toFixed(2)),
        fcr: Number(fcr.toFixed(2)),
        costPerKg: Number(costPerKg.toFixed(2)),
        dailyWeightGain: Number(dailyWeightGain.toFixed(1)),
        performance,
      },
      benchmarks,
      fcrTrend,
      feedRecordsCount: feedRecords.length,
      weightRecordsCount: weightRecords.length,
    });
  } catch (error) {
    console.error('Error calculating FCR:', error);
    return NextResponse.json(
      { error: 'Failed to calculate FCR' },
      { status: 500 }
    );
  }
}
