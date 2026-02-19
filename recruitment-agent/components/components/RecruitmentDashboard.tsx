'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  MessageCircle,
  Trophy,
  User,
  School,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Zap,
  Heart,
  ExternalLink,
  Edit2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StatsData {
  emailsSent: number;
  emailsToday: number;
  dmsSent: number;
  dmsToday: number;
  responsesReceived: number;
  responseRate: number;
}

interface AthleteProfile {
  name: string;
  school: string;
  gradYear: number;
  position: string;
  height: string;
  weight: string;
  ppg: number;
  rpg: number;
  spg: number;
  mpg: number;
  hudlUrl: string;
  xProfileUrl: string;
}

interface ActivityItem {
  id: string;
  coachName: string;
  school: string;
  division: string;
  timestamp: string;
  type: 'email' | 'dm';
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'failed';
  preview: string;
  fullMessage?: string;
}

interface ResponseItem {
  id: string;
  coachName: string;
  school: string;
  date: string;
  preview: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  forwarded: boolean;
  fullMessage: string;
}

interface Coach {
  id: string;
  name: string;
  school: string;
  division: string;
  state: string;
  email: string;
  status: 'pending' | 'sent' | 'contacted';
}

export default function RecruitmentDashboard() {
  const campaignId = 'campaign-001'; // This would come from props/context in a real app

  const [stats, setStats] = useState<StatsData>({
    emailsSent: 0,
    emailsToday: 0,
    dmsSent: 0,
    dmsToday: 0,
    responsesReceived: 0,
    responseRate: 0,
  });

  const [athleteProfile] = useState<AthleteProfile>({
    name: 'Marcus Johnson',
    school: 'State University',
    gradYear: 2026,
    position: 'SG',
    height: '6\'4"',
    weight: '195 lbs',
    ppg: 18.5,
    rpg: 5.2,
    spg: 1.8,
    mpg: 32.0,
    hudlUrl: 'https://hudl.com/profile/marcus-johnson',
    xProfileUrl: 'https://x.com/marcusjohnson',
  });

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState(25);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/recruit/stats?campaignId=${campaignId}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load stats');
    }
  };

  // Fetch coaches queue
  const fetchCoaches = async () => {
    try {
      const response = await fetch(
        `/api/recruit/coaches?campaignId=${campaignId}&contacted=false`
      );
      if (!response.ok) throw new Error('Failed to fetch coaches');
      const data = await response.json();
      setCoaches(data.slice(0, 20));
    } catch (err) {
      console.error('Error fetching coaches:', err);
    }
  };

  // Fetch responses
  const fetchResponses = async () => {
    try {
      const response = await fetch(`/api/recruit/responses?campaignId=${campaignId}`);
      if (!response.ok) throw new Error('Failed to fetch responses');
      const data = await response.json();
      setResponses(data);
    } catch (err) {
      console.error('Error fetching responses:', err);
    }
  };

  // Fetch activity (mock data for now)
  const fetchActivity = async () => {
    try {
      // Mock activity data - replace with actual API call
      const mockActivity: ActivityItem[] = [
        {
          id: '1',
          coachName: 'Coach Smith',
          school: 'ACC University',
          division: 'D1',
          timestamp: '2025-01-15T14:30:00Z',
          type: 'email',
          status: 'opened',
          preview: 'Hi Marcus, interested in your profile...',
          fullMessage:
            'Hi Marcus,\n\nWe are very interested in your profile. Your stats are impressive and we would like to discuss opportunities at our institution.',
        },
        {
          id: '2',
          coachName: 'Coach Johnson',
          school: 'Big Ten State',
          division: 'D1',
          timestamp: '2025-01-15T13:15:00Z',
          type: 'dm',
          status: 'delivered',
          preview: 'Checking out your highlight reel now...',
        },
        {
          id: '3',
          coachName: 'Coach Williams',
          school: 'Mid-Major College',
          division: 'D2',
          timestamp: '2025-01-15T12:00:00Z',
          type: 'email',
          status: 'sent',
          preview: 'Great numbers this season!',
        },
        {
          id: '4',
          coachName: 'Coach Davis',
          school: 'NAIA School',
          division: 'NAIA',
          timestamp: '2025-01-15T10:45:00Z',
          type: 'email',
          status: 'replied',
          preview: 'Offered scholarship package',
          fullMessage: 'We would like to offer Marcus a partial scholarship...',
        },
        {
          id: '5',
          coachName: 'Coach Brown',
          school: 'Junior College',
          division: 'JUCO',
          timestamp: '2025-01-15T09:30:00Z',
          type: 'dm',
          status: 'failed',
          preview: 'Unable to send - account issue',
        },
      ];
      setActivity(mockActivity);
    } catch (err) {
      console.error('Error fetching activity:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchCoaches(), fetchResponses(), fetchActivity()]);
      setLoading(false);
    };

    loadDashboard();
  }, []);

  // Auto-refresh during active sends
  useEffect(() => {
    if (!isSending) return;

    const interval = setInterval(() => {
      fetchStats();
      fetchActivity();
      // Simulate progress
      setSendProgress((prev) => {
        if (prev >= 100) {
          setIsSending(false);
          return 0;
        }
        return prev + Math.random() * 15;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [isSending]);

  // Handle batch send
  const handleBatchSend = async () => {
    setIsSending(true);
    setSendProgress(0);

    try {
      const response = await fetch('/api/recruit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          batchSize,
        }),
      });

      if (!response.ok) throw new Error('Failed to start batch send');

      // Simulate progress over 5 seconds
      const progressInterval = setInterval(() => {
        setSendProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsSending(false);
            fetchStats();
            fetchActivity();
            return 100;
          }
          return prev + Math.random() * 20;
        });
      }, 500);
    } catch (err) {
      console.error('Error starting batch send:', err);
      setIsSending(false);
      setError('Failed to start batch send');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
      opened: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      replied: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
      pending: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      contacted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };
    return colors[status] || colors.pending;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    const iconClass = 'w-3 h-3';
    switch (status) {
      case 'sent':
        return <Send className={iconClass} />;
      case 'delivered':
        return <CheckCircle className={iconClass} />;
      case 'opened':
        return <Mail className={iconClass} />;
      case 'replied':
        return <Heart className={iconClass} />;
      case 'failed':
        return <XCircle className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-emerald-400';
      case 'neutral':
        return 'text-slate-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  // Filter coaches by division
  const filteredCoaches =
    divisionFilter === 'all' ? coaches : coaches.filter((c) => c.division === divisionFilter);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-6">
      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl font-bold">Recruitment Agent</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg text-slate-400">Campaign:</span>
          <span className="text-lg font-semibold">Marcus Johnson - 2026</span>
          <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-sm font-medium">
            Active
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Emails Sent */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-medium">Emails Sent</span>
            <Mail className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{stats.emailsSent}</span>
            <span className="text-sm text-slate-400">
              {stats.emailsToday} today
            </span>
          </div>
        </div>

        {/* DMs Sent */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-medium">DMs Sent</span>
            <MessageCircle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{stats.dmsSent}</span>
            <span className="text-sm text-slate-400">
              {stats.dmsToday} today
            </span>
          </div>
        </div>

        {/* Responses Received */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-medium">Responses</span>
            <Heart className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{stats.responsesReceived}</span>
            <span className="text-sm text-slate-400">coaches</span>
          </div>
        </div>

        {/* Response Rate */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-medium">Response Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{stats.responseRate.toFixed(1)}%</span>
            <span className="text-sm text-slate-400">conversion</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Athlete Profile Card */}
        <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">{athleteProfile.name}</h2>
              <p className="text-slate-400 text-sm">{athleteProfile.school}</p>
            </div>
            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <Edit2 className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Position</p>
              <p className="text-lg font-semibold">{athleteProfile.position}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Grad Year</p>
              <p className="text-lg font-semibold">{athleteProfile.gradYear}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Height</p>
              <p className="text-lg font-semibold">{athleteProfile.height}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Weight</p>
              <p className="text-lg font-semibold">{athleteProfile.weight}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-3">Season Stats</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold">{athleteProfile.ppg.toFixed(1)}</p>
                <p className="text-xs text-slate-400">PPG</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold">{athleteProfile.rpg.toFixed(1)}</p>
                <p className="text-xs text-slate-400">RPG</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold">{athleteProfile.spg.toFixed(1)}</p>
                <p className="text-xs text-slate-400">SPG</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold">{athleteProfile.mpg.toFixed(1)}</p>
                <p className="text-xs text-slate-400">MPG</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <a
              href={athleteProfile.hudlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              HUDL
            </a>
            <a
              href={athleteProfile.xProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              X Profile
            </a>
          </div>
        </div>

        {/* Action Panel & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Panel */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Send Batch Campaign
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Batch Size</label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  disabled={isSending}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 disabled:opacity-50 focus:outline-none focus:border-slate-500"
                >
                  <option value={10}>10 coaches</option>
                  <option value={25}>25 coaches</option>
                  <option value={50}>50 coaches</option>
                  <option value={100}>100 coaches</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-2">Status</label>
                <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isSending ? 'bg-yellow-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  {isSending ? 'Sending...' : 'Ready'}
                </div>
              </div>
            </div>

            {isSending && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Progress</span>
                  <span className="text-xs font-bold">{Math.round(sendProgress)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                    style={{ width: `${sendProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleBatchSend}
              disabled={isSending}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {isSending ? 'Sending Campaign...' : 'Send Batch'}
            </button>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Recent Activity
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activity.length === 0 ? (
                <p className="text-slate-400 text-sm py-4 text-center">No activity yet</p>
              ) : (
                activity.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 hover:border-slate-500 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpandedActivityId(expandedActivityId === item.id ? null : item.id)
                    }
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === 'email' ? (
                            <Mail className="w-4 h-4 text-blue-400" />
                          ) : (
                            <MessageCircle className="w-4 h-4 text-purple-400" />
                          )}
                          <span className="font-semibold">{item.coachName}</span>
                          <span className="text-xs text-slate-400">{item.school}</span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
                              item.status
                            )}`}
                          >
                            <div className="flex items-center gap-1">
                              {getStatusIcon(item.status)}
                              {item.status}
                            </div>
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{item.preview}</p>
                      </div>
                      {expandedActivityId === item.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                    </div>

                    {expandedActivityId === item.id && item.fullMessage && (
                      <div className="mt-3 pt-3 border-t border-slate-600">
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">
                          {item.fullMessage}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Responses Panel */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-400" />
          Coach Responses ({responses.length})
        </h3>

        {responses.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">No responses yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {responses.map((response) => (
              <div
                key={response.id}
                className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold">{response.coachName}</h4>
                    <p className="text-sm text-slate-400">{response.school}</p>
                  </div>
                  <div className={`text-lg ${getSentimentColor(response.sentiment)}`}>
                    {response.sentiment === 'positive' && '😊'}
                    {response.sentiment === 'neutral' && '😐'}
                    {response.sentiment === 'negative' && '😕'}
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                  {response.preview}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{response.date}</span>
                  {response.forwarded && (
                    <span className="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded border border-emerald-500/30">
                      Forwarded
                    </span>
                  )}
                  {!response.forwarded && (
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-sm font-medium rounded transition-colors">
                      Forward to Parent
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coach Queue */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <School className="w-5 h-5 text-slate-400" />
            Coach Queue (Next 20)
          </h3>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-50 focus:outline-none focus:border-slate-500"
            >
              <option value="all">All Divisions</option>
              <option value="D1">D1</option>
              <option value="D2">D2</option>
              <option value="NAIA">NAIA</option>
              <option value="JUCO">JUCO</option>
            </select>
          </div>
        </div>

        {filteredCoaches.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">No coaches in queue</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">School</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Division</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">State</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoaches.map((coach) => (
                  <tr
                    key={coach.id}
                    className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{coach.name}</td>
                    <td className="px-4 py-3 text-slate-400">{coach.school}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 bg-slate-700 rounded text-xs font-medium">
                        {coach.division}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{coach.state}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs truncate">
                      {coach.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                          coach.status
                        )}`}
                      >
                        {coach.status === 'pending' && <Clock className="w-3 h-3" />}
                        {coach.status === 'sent' && <Send className="w-3 h-3" />}
                        {coach.status === 'contacted' && <CheckCircle className="w-3 h-3" />}
                        {coach.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
