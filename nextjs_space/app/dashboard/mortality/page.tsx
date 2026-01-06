import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MortalityPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mortality Records</h1>
      <p className="text-gray-600">Track mortality - Coming Soon</p>
    </div>
  );
}
