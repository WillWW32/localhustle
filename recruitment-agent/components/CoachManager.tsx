'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Download,
  Upload,
  Filter,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader,
  School,
  Users,
  Award,
  Globe,
  Mail as MailIcon,
  Phone as PhoneIcon,
  ExternalLink,
} from 'lucide-react';

/**
 * Coach interface matching Supabase schema
 */
interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  school: string;
  division?: string;
  state?: string;
  title?: string;
  phone?: string;
  created_at?: string;
}

/**
 * Scraped coach from API before saving
 */
interface ScrapedCoach {
  firstName?: string;
  lastName?: string;
  fullName: string;
  title: string;
  email?: string;
  phone?: string;
}

interface ScrapeResult {
  success: boolean;
  schoolName: string;
  division: string | null;
  state: string | null;
  url: string;
  coachCount: number;
  coaches: ScrapedCoach[];
  error?: string;
}

/**
 * CoachManager Component
 * Provides interface for coach database management, scraping, and bulk operations
 */
export default function CoachManager() {
  // State management
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [contactedFilter, setContactedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected coaches for bulk actions
  const [selectedCoaches, setSelectedCoaches] = useState<Set<string>>(new Set());

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScrapeForm, setShowScrapeForm] = useState(false);

  // Add coach form
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    school: '',
    division: '',
    state: '',
    title: '',
    phone: '',
  });

  // Scrape form
  const [scrapeData, setScrapeData] = useState({
    url: '',
    schoolName: '',
    division: 'D1',
    state: '',
  });

  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeResults, setScrapeResults] = useState<ScrapeResult | null>(null);
  const [scrapedCoachesSelected, setScrapedCoachesSelected] = useState<Set<number>>(new Set());

  // Pagination and display
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Fetch coaches on component mount
  useEffect(() => {
    fetchCoaches();
  }, []);

  // Fetch coaches from API
  const fetchCoaches = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (divisionFilter !== 'all') params.append('division', divisionFilter);
      if (stateFilter !== 'all') params.append('state', stateFilter);

      const response = await fetch(`/api/recruit/coaches?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch coaches');

      const data = await response.json();
      setCoaches(data.coaches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch coaches');
    } finally {
      setLoading(false);
    }
  };

  // Add single coach
  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recruit/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add coach');
      }

      const data = await response.json();
      setCoaches([...coaches, data.coach]);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        school: '',
        division: '',
        state: '',
        title: '',
        phone: '',
      });
      setShowAddForm(false);
      setSuccess(`Coach ${formData.first_name} ${formData.last_name} added successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add coach');
    } finally {
      setLoading(false);
    }
  };

  // Scrape school
  const handleScrapeSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setScrapeLoading(true);
    setError(null);
    setScrapeResults(null);

    try {
      const response = await fetch('/api/recruit/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape school');
      }

      const data = await response.json();
      setScrapeResults(data);
      setScrapedCoachesSelected(new Set());
      setSuccess(`Found ${data.coachCount} coach(es) at ${scrapeData.schoolName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape school');
    } finally {
      setScrapeLoading(false);
    }
  };

  // Save scraped coaches to database
  const handleSaveScrapedCoaches = async () => {
    if (!scrapeResults || scrapedCoachesSelected.size === 0) {
      setError('Please select at least one coach to save');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedCoaches = Array.from(scrapedCoachesSelected).map(
        idx => scrapeResults.coaches[idx]
      );

      let savedCount = 0;
      for (const coach of selectedCoaches) {
        try {
          const response = await fetch('/api/recruit/coaches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: coach.firstName || '',
              last_name: coach.lastName || '',
              email: coach.email || '',
              school: scrapeResults.schoolName,
              division: scrapeResults.division,
              state: scrapeResults.state,
              title: coach.title,
              phone: coach.phone,
            }),
          });

          if (response.ok) {
            savedCount++;
            const data = await response.json();
            setCoaches(prev => [...prev, data.coach]);
          }
        } catch (err) {
          console.error(`Failed to save ${coach.fullName}:`, err);
        }
      }

      setSuccess(`Saved ${savedCount} coach(es) to database`);
      setScrapeResults(null);
      setShowScrapeForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coaches');
    } finally {
      setLoading(false);
    }
  };

  // Delete coach
  const handleDeleteCoach = async (coachId: string) => {
    if (!confirm('Are you sure you want to delete this coach?')) return;

    setError(null);
    try {
      const response = await fetch(`/api/recruit/coaches/${coachId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete coach');

      setCoaches(coaches.filter(c => c.id !== coachId));
      setSuccess('Coach deleted successfully');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete coach');
    }
  };

  // Filter and search coaches
  const filteredCoaches = coaches.filter(coach => {
    if (divisionFilter !== 'all' && coach.division !== divisionFilter) return false;
    if (stateFilter !== 'all' && coach.state !== stateFilter) return false;

    const searchLower = searchQuery.toLowerCase();
    if (
      !coach.first_name.toLowerCase().includes(searchLower) &&
      !coach.last_name.toLowerCase().includes(searchLower) &&
      !coach.email.toLowerCase().includes(searchLower) &&
      !coach.school.toLowerCase().includes(searchLower)
    ) {
      return false;
    }

    return true;
  });

  // Calculate stats
  const stats = {
    total: coaches.length,
    d1: coaches.filter(c => c.division === 'D1').length,
    d2: coaches.filter(c => c.division === 'D2').length,
    d3: coaches.filter(c => c.division === 'D3').length,
    naia: coaches.filter(c => c.division === 'NAIA').length,
    juco: coaches.filter(c => c.division === 'JUCO').length,
  };

  // Get unique states for filter
  const states = Array.from(new Set(coaches.map(c => c.state).filter(Boolean))).sort();

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCoaches = filteredCoaches.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredCoaches.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-6">
      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-emerald-400 hover:text-emerald-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Coach Manager</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowAddForm(true);
                setShowScrapeForm(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Coach
            </button>
            <button
              onClick={() => {
                setShowScrapeForm(true);
                setShowAddForm(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              <Globe className="w-5 h-5" />
              Scrape School
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-medium uppercase">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-medium uppercase">D1</p>
            <p className="text-2xl font-bold text-blue-400">{stats.d1}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-medium uppercase">D2</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.d2}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-medium uppercase">D3</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.d3}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-medium uppercase">NAIA</p>
            <p className="text-2xl font-bold text-purple-400">{stats.naia}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs font-medium uppercase">JUCO</p>
            <p className="text-2xl font-bold text-pink-400">{stats.juco}</p>
          </div>
        </div>
      </div>

      {/* Add Coach Form */}
      {showAddForm && (
        <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Add Coach Manually</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddCoach} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="First Name"
              required
              value={formData.first_name}
              onChange={e => setFormData({ ...formData, first_name: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Last Name"
              required
              value={formData.last_name}
              onChange={e => setFormData({ ...formData, last_name: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="School"
              required
              value={formData.school}
              onChange={e => setFormData({ ...formData, school: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <select
              value={formData.division}
              onChange={e => setFormData({ ...formData, division: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:border-blue-500"
            >
              <option value="">Division</option>
              <option value="D1">D1</option>
              <option value="D2">D2</option>
              <option value="D3">D3</option>
              <option value="NAIA">NAIA</option>
              <option value="JUCO">JUCO</option>
            </select>
            <input
              type="text"
              placeholder="State"
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="lg:col-span-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Adding...' : 'Add Coach'}
            </button>
          </form>
        </div>
      )}

      {/* Scrape School Form */}
      {showScrapeForm && (
        <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Scrape School Athletics Page</h2>
            <button
              onClick={() => {
                setShowScrapeForm(false);
                setScrapeResults(null);
              }}
              className="text-slate-400 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!scrapeResults ? (
            <form onSubmit={handleScrapeSchool} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <input
                type="url"
                placeholder="Athletics URL"
                required
                value={scrapeData.url}
                onChange={e => setScrapeData({ ...scrapeData, url: e.target.value })}
                className="lg:col-span-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="School Name"
                required
                value={scrapeData.schoolName}
                onChange={e => setScrapeData({ ...scrapeData, schoolName: e.target.value })}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <select
                value={scrapeData.division}
                onChange={e => setScrapeData({ ...scrapeData, division: e.target.value })}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:border-purple-500"
              >
                <option value="D1">D1</option>
                <option value="D2">D2</option>
                <option value="D3">D3</option>
                <option value="NAIA">NAIA</option>
                <option value="JUCO">JUCO</option>
              </select>
              <input
                type="text"
                placeholder="State"
                value={scrapeData.state}
                onChange={e => setScrapeData({ ...scrapeData, state: e.target.value })}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={scrapeLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {scrapeLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                {scrapeLoading ? 'Scraping...' : 'Scrape'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <h3 className="font-semibold mb-2">Found {scrapeResults.coachCount} Coach(es)</h3>
                <p className="text-sm text-slate-300 mb-2">School: {scrapeResults.schoolName}</p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scrapeResults.coaches.map((coach, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-3 p-2 hover:bg-slate-600/50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={scrapedCoachesSelected.has(idx)}
                        onChange={e => {
                          const newSelected = new Set(scrapedCoachesSelected);
                          if (e.target.checked) {
                            newSelected.add(idx);
                          } else {
                            newSelected.delete(idx);
                          }
                          setScrapedCoachesSelected(newSelected);
                        }}
                        className="mt-1 w-4 h-4 rounded accent-blue-500"
                      />
                      <div className="flex-1 text-sm">
                        <p className="font-medium">{coach.fullName}</p>
                        <p className="text-slate-400">{coach.title}</p>
                        {coach.email && <p className="text-slate-500 text-xs">{coach.email}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveScrapedCoaches}
                  disabled={loading || scrapedCoachesSelected.size === 0}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {loading ? 'Saving...' : `Save ${scrapedCoachesSelected.size} Coach(es)`}
                </button>
                <button
                  onClick={() => {
                    setScrapeResults(null);
                    setScrapeData({ url: '', schoolName: '', division: 'D1', state: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[250px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, school..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 bg-transparent text-slate-50 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <select
          value={divisionFilter}
          onChange={e => {
            setDivisionFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:border-blue-500 text-sm"
        >
          <option value="all">All Divisions</option>
          <option value="D1">D1</option>
          <option value="D2">D2</option>
          <option value="D3">D3</option>
          <option value="NAIA">NAIA</option>
          <option value="JUCO">JUCO</option>
        </select>

        <select
          value={stateFilter}
          onChange={e => {
            setStateFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:border-blue-500 text-sm"
        >
          <option value="all">All States</option>
          {states.map(state => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>

        {selectedCoaches.size > 0 && (
          <button
            onClick={() => setSelectedCoaches(new Set())}
            className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
          >
            Deselect All ({selectedCoaches.size})
          </button>
        )}
      </div>

      {/* Coaches Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : paginatedCoaches.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No coaches found</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm"
            >
              Add your first coach
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50 border-b border-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCoaches.size === paginatedCoaches.length}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedCoaches(new Set(paginatedCoaches.map(c => c.id)));
                          } else {
                            setSelectedCoaches(new Set());
                          }
                        }}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">School</th>
                    <th className="px-4 py-3 text-left font-semibold">Division</th>
                    <th className="px-4 py-3 text-left font-semibold">State</th>
                    <th className="px-4 py-3 text-left font-semibold">Title</th>
                    <th className="px-4 py-3 text-left font-semibold">Contact</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {paginatedCoaches.map(coach => (
                    <tr key={coach.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCoaches.has(coach.id)}
                          onChange={e => {
                            const newSelected = new Set(selectedCoaches);
                            if (e.target.checked) {
                              newSelected.add(coach.id);
                            } else {
                              newSelected.delete(coach.id);
                            }
                            setSelectedCoaches(newSelected);
                          }}
                          className="w-4 h-4 rounded accent-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {coach.first_name} {coach.last_name}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <School className="w-4 h-4 text-blue-400" />
                        {coach.school}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-slate-700 rounded text-xs font-medium">
                          {coach.division || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{coach.state || '-'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{coach.title || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {coach.email && (
                            <a
                              href={`mailto:${coach.email}`}
                              title={coach.email}
                              className="p-1 hover:bg-slate-700 rounded text-blue-400 transition-colors"
                            >
                              <MailIcon className="w-4 h-4" />
                            </a>
                          )}
                          {coach.phone && (
                            <a
                              href={`tel:${coach.phone}`}
                              title={coach.phone}
                              className="p-1 hover:bg-slate-700 rounded text-emerald-400 transition-colors"
                            >
                              <PhoneIcon className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteCoach(coach.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-red-400 hover:bg-red-500/20 rounded transition-colors text-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-4 bg-slate-700/30 border-t border-slate-600 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCoaches.length)} of{' '}
                  {filteredCoaches.length} coaches
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
