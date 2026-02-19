'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Zap, TrendingUp, LogOut } from 'lucide-react';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  sport: string;
  position: string;
  highSchool: string;
  gradYear: string;
  campaignStatus: 'active' | 'paused' | 'pending';
  responseCount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch athletes for this user
    // For now, we'll use mock data
    setIsLoading(true);
    try {
      // This would be replaced with actual API call
      const mockAthletes: Athlete[] = [
        {
          id: '1',
          firstName: 'Alex',
          lastName: 'Johnson',
          sport: 'Football',
          position: 'Quarterback',
          highSchool: 'Lincoln High',
          gradYear: '2025',
          campaignStatus: 'active',
          responseCount: 12,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Martinez',
          sport: 'Soccer',
          position: 'Forward',
          highSchool: 'Central High',
          gradYear: '2026',
          campaignStatus: 'active',
          responseCount: 8,
          createdAt: new Date().toISOString(),
        },
      ];
      setAthletes(mockAthletes);
    } catch (err) {
      setError('Failed to load athletes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: 'bg-green-900/30 text-green-400 border border-green-700',
      paused: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700',
      pending: 'bg-blue-900/30 text-blue-400 border border-blue-700',
    };
    return statusConfig[status as keyof typeof statusConfig] || '';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Campaign Active',
      paused: 'Campaign Paused',
      pending: 'Campaign Pending',
    };
    return labels[status as keyof typeof labels] || '';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 sticky top-0 z-50 bg-slate-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-blue-500">Local</span>Hustle Dashboard
            </h1>
            <p className="text-sm text-slate-400">Manage your athlete recruitment campaigns</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/hub"
              className="text-slate-300 hover:text-white transition flex items-center gap-2"
            >
              <LogOut size={18} />
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Athletes</p>
                <p className="text-3xl font-bold">{athletes.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Active Campaigns</p>
                <p className="text-3xl font-bold">
                  {athletes.filter((a) => a.campaignStatus === 'active').length}
                </p>
              </div>
              <Zap className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Responses</p>
                <p className="text-3xl font-bold">
                  {athletes.reduce((sum, a) => sum + a.responseCount, 0)}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-cyan-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Heading with Add button */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Your Athletes</h2>
          <Link
            href="/hub/signup"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            <Plus size={20} />
            Add Athlete
          </Link>
        </div>

        {/* Athletes Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading athletes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        ) : athletes.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700 border-dashed">
            <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No athletes yet</h3>
            <p className="text-slate-400 mb-6">
              Get started by adding your first athlete to the platform.
            </p>
            <Link
              href="/hub/signup"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              <Plus size={18} />
              Add Your First Athlete
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {athletes.map((athlete) => (
              <Link
                key={athlete.id}
                href={`/hub/dashboard/athletes/${athlete.id}`}
                className="block bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-blue-500 hover:bg-slate-800/50 transition"
              >
                <div className="grid md:grid-cols-5 gap-4 items-center">
                  {/* Athlete info */}
                  <div className="md:col-span-2">
                    <h3 className="text-xl font-bold mb-1">
                      {athlete.firstName} {athlete.lastName}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                      <span>{athlete.sport}</span>
                      <span>•</span>
                      <span>{athlete.position}</span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {athlete.highSchool} • Class of {athlete.gradYear}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className="md:col-span-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(athlete.campaignStatus)}`}>
                      {getStatusLabel(athlete.campaignStatus)}
                    </span>
                  </div>

                  {/* Response count */}
                  <div className="md:col-span-1 text-right">
                    <p className="text-2xl font-bold text-green-400">
                      {athlete.responseCount}
                    </p>
                    <p className="text-xs text-slate-400">Coach Responses</p>
                  </div>

                  {/* Arrow */}
                  <div className="md:col-span-1 text-right hidden md:block">
                    <div className="text-slate-500 hover:text-blue-400 transition">→</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          <p>&copy; 2024 LocalHustle. Managing athlete recruitment.</p>
        </div>
      </footer>
    </div>
  );
}
