import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewFlockPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create New Flock</h1>
      <p className="text-gray-600">Create a new flock - Coming Soon</p>
    </div>
  );
}
