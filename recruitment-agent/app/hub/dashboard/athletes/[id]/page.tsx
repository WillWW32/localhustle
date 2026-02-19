'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Play, Pause, Lock, ExternalLink, Bell,
  Send, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Mail, RefreshCw, AlertCircle, Edit3, Users
} from 'lucide-react';

// ── Types ──
interface AthleteProfile {
  id: string;
  firstName: string;
  lastName: string;
  sport: string;
  position: string;
  height: string;
  weight: string;
  highSchool: string;
  city: string;
  state: string;
  gradYear: string;
  bio: string;
  highlightUrl: string;
  xConnected: boolean;
  profilePhoto?: string;
}

interface RespondedCoach {
  responseId: string;
  coachId: string;
  coachName: string;
  school: string;
  division: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'interested';
  responseBody: string;
  responseSubject: string;
  respondedAt: string;
  followUpSent: boolean;
}

interface NonRespondedCoach {
  coachId: string;
  coachName: string;
  school: string;
  division: string;
  email: string;
  sentAt: string;
  daysSince: number | null;
  followUpSent: boolean;
}

interface FollowUpStats {
  totalSent: number;
  responded: number;
  nonResponded: number;
  followUpsSent: number;
  responseRate: number;
}

interface FollowUpTemplates {
  responded_positive: string;
  responded_neutral: string;
  no_response: string;
}

type Tab = 'profile' | 'campaign' | 'followups' | 'responses' | 'settings';

// ── Component ──
export default function AthleteManagementPage({ params }: { params: { id: string } }) {
  const [currentTab, setCurrentTab] = useState<Tab>('profile');

  // Athlete state (mock for now, would come from API)
  const [athlete] = useState<AthleteProfile>({
    id: params.id,
    firstName: 'Josiah',
    lastName: 'Boone',
    sport: 'Basketball',
    position: 'Guard/Wing',
    height: '6\'4"',
    weight: '185',
    highSchool: 'Big Sky High School',
    city: 'Missoula',
    state: 'MT',
    gradYear: '2026',
    bio: 'Josiah "Sia" Boone is a 6\'4" athletic guard. A true 3-level scorer averaging 19.6 points, 6.8 rebounds, and 3.7 steals per game.',
    highlightUrl: 'https://www.hudl.com/video/3/25464634/698cfa0a6c260ff59d273b34',
    xConnected: false,
  });

  const [campaignStatus, setCampaignStatus] = useState<'active' | 'paused'>('active');
  const [sendCount] = useState({ total: 147, thisWeek: 28, today: 5 });

  // Follow-up state
  const [followUpData, setFollowUpData] = useState<{
    responded: RespondedCoach[];
    nonResponded: NonRespondedCoach[];
    templates: FollowUpTemplates;
    stats: FollowUpStats;
  } | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpView, setFollowUpView] = useState<'responded' | 'no_response'>('no_response');
  const [expandedCoach, setExpandedCoach] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Record<string, string>>({});
  const [sendingFollowUp, setSendingFollowUp] = useState<string | null>(null);
  const [sentFollowUps, setSentFollowUps] = useState<Set<string>>(new Set());
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);

  // Fetch follow-up data
  const fetchFollowUps = useCallback(async () => {
    setFollowUpLoading(true);
    try {
      // TODO: Replace with real campaignId from athlete data
      const campaignId = 'demo'; // Will come from real data
      const res = await fetch(`/api/recruit/followup?campaignId=${campaignId}&athleteId=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setFollowUpData(data);
      }
    } catch (err) {
      console.error('Failed to fetch follow-ups:', err);
    } finally {
      setFollowUpLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (currentTab === 'followups') {
      fetchFollowUps();
    }
  }, [currentTab, fetchFollowUps]);

  // Get pre-populated message for a coach
  const getFollowUpMessage = (coachId: string, type: 'no_response' | 'responded_positive' | 'responded_neutral') => {
    if (editingMessage[coachId]) return editingMessage[coachId];
    if (!followUpData?.templates) return '';
    return followUpData.templates[type] || followUpData.templates.no_response;
  };

  // Send individual follow-up
  const sendFollowUp = async (coachId: string, message: string) => {
    setSendingFollowUp(coachId);
    try {
      const res = await fetch('/api/recruit/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'demo',
          athleteId: params.id,
          coachId,
          message,
        }),
      });
      if (res.ok) {
        setSentFollowUps(prev => new Set([...prev, coachId]));
        setExpandedCoach(null);
      }
    } catch (err) {
      console.error('Failed to send follow-up:', err);
    } finally {
      setSendingFollowUp(null);
    }
  };

  // Bulk send follow-ups
  const sendBulkFollowUps = async () => {
    setBulkSending(true);
    const template = followUpData?.templates.no_response || '';
    for (const coachId of bulkSelected) {
      const msg = editingMessage[coachId] || template;
      await sendFollowUp(coachId, msg);
      // Small delay between sends
      await new Promise(r => setTimeout(r, 500));
    }
    setBulkSelected(new Set());
    setBulkSending(false);
  };

  // Toggle bulk selection
  const toggleBulkSelect = (coachId: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(coachId)) next.delete(coachId);
      else next.add(coachId);
      return next;
    });
  };

  const selectAllNonResponded = () => {
    if (!followUpData) return;
    const eligible = followUpData.nonResponded
      .filter(c => !c.followUpSent && !sentFollowUps.has(c.coachId))
      .map(c => c.coachId);
    setBulkSelected(new Set(eligible));
  };

  // ── Helpers ──
  const getSentimentColor = (sentiment: string) => {
    const colors: Record<string, string> = {
      positive: 'bg-green-900/30 text-green-400 border border-green-700',
      interested: 'bg-green-900/30 text-green-400 border border-green-700',
      neutral: 'bg-slate-700/30 text-slate-300 border border-slate-600',
      negative: 'bg-red-900/30 text-red-400 border border-red-700',
    };
    return colors[sentiment] || colors.neutral;
  };

  const getSentimentLabel = (sentiment: string) => {
    const labels: Record<string, string> = {
      positive: 'Interested',
      interested: 'Interested',
      neutral: 'Acknowledged',
      negative: 'Not Interested',
    };
    return labels[sentiment] || 'Unknown';
  };

  const getDivisionBadge = (division: string) => {
    const colors: Record<string, string> = {
      D1: 'bg-purple-900/40 text-purple-300 border-purple-700',
      D2: 'bg-blue-900/40 text-blue-300 border-blue-700',
      NAIA: 'bg-teal-900/40 text-teal-300 border-teal-700',
      JUCO: 'bg-orange-900/40 text-orange-300 border-orange-700',
    };
    return colors[division] || 'bg-slate-700/40 text-slate-300 border-slate-600';
  };

  // ── Demo data (used when API hasn't loaded yet) ──
  const demoStats: FollowUpStats = { totalSent: 47, responded: 6, nonResponded: 41, followUpsSent: 0, responseRate: 13 };
  const demoTemplates: FollowUpTemplates = {
    responded_positive: `Coach {{coach_last}},\n\nThank you for your response and interest. I am very excited about the opportunity at {{school}}.\n\nI wanted to follow up and see if there are any next steps, whether that is a phone call, campus visit, or additional film you would like to see.\n\nHere is my highlight film again for reference:\n{{highlight_url}}\n\nRespectfully,\n{{athlete_first}} {{athlete_last}}`,
    responded_neutral: `Coach {{coach_last}},\n\nThank you for getting back to me. I wanted to follow up and share that I am still very interested in {{school}}.\n\nHere is my updated highlight film:\n{{highlight_url}}\n\nRespectfully,\n{{athlete_first}} {{athlete_last}}`,
    no_response: `Coach {{coach_last}},\n\nI hope this message finds you well. I reached out a few weeks ago about my interest in {{school}} and your basketball program.\n\nI wanted to follow up in case my original email was missed. I am a {{grad_year}} {{position}} from {{high_school}} in {{city}}, {{state}} — {{height}}, averaging {{ppg}} PPG, {{rpg}} RPG, and {{spg}} SPG.\n\nHere is my highlight film:\n{{highlight_url}}\n\nThank you for your time, Coach.\n\nRespectfully,\n{{athlete_first}} {{athlete_last}}\n{{high_school}} — Class of {{grad_year}}`,
  };

  const demoResponded: RespondedCoach[] = [
    { responseId: '1', coachId: 'c1', coachName: 'Coach Travis DeCuire', school: 'University of Montana', division: 'D1', sentiment: 'positive', responseBody: 'Very impressed with your game film. Would love to discuss opportunities. Can you come to campus for an unofficial visit?', responseSubject: 'Re: Recruitment', respondedAt: new Date(Date.now() - 2 * 86400000).toISOString(), followUpSent: false },
    { responseId: '2', coachId: 'c2', coachName: 'Coach Wayne Tinkle', school: 'Oregon State', division: 'D1', sentiment: 'neutral', responseBody: 'Thanks for reaching out. We will keep your profile on file and reach out if a spot opens up.', responseSubject: 'Re: Recruitment', respondedAt: new Date(Date.now() - 5 * 86400000).toISOString(), followUpSent: false },
    { responseId: '3', coachId: 'c3', coachName: 'Coach Mark Few', school: 'Gonzaga', division: 'D1', sentiment: 'positive', responseBody: 'Interested in learning more. Can you send your junior year game footage as well?', responseSubject: 'Re: Film Request', respondedAt: new Date(Date.now() - 3 * 86400000).toISOString(), followUpSent: false },
    { responseId: '4', coachId: 'c8', coachName: 'Coach Steve Halfman', school: 'Carroll College', division: 'NAIA', sentiment: 'positive', responseBody: 'We have been watching your tape. Would love to get you on campus for a visit. What weekends work for you?', responseSubject: 'Re: Visit', respondedAt: new Date(Date.now() - 1 * 86400000).toISOString(), followUpSent: false },
    { responseId: '5', coachId: 'c9', coachName: 'Coach Jeff Malby', school: 'Montana State Billings', division: 'D2', sentiment: 'neutral', responseBody: 'Received your info. We are currently evaluating our recruiting class. Will be in touch.', responseSubject: 'Re: Recruitment', respondedAt: new Date(Date.now() - 8 * 86400000).toISOString(), followUpSent: false },
    { responseId: '6', coachId: 'c10', coachName: 'Coach Eric Reveno', school: 'Seattle U', division: 'D1', sentiment: 'negative', responseBody: 'Thank you for your interest but we have filled our guard spots for the 2026 class. Best of luck.', responseSubject: 'Re: Recruitment', respondedAt: new Date(Date.now() - 10 * 86400000).toISOString(), followUpSent: false },
  ];

  const demoNonResponded: NonRespondedCoach[] = [
    { coachId: 'c4', coachName: 'Coach Bobby Hurley', school: 'Arizona State', division: 'D1', email: 'bhurley@asu.edu', sentAt: new Date(Date.now() - 14 * 86400000).toISOString(), daysSince: 14, followUpSent: false },
    { coachId: 'c5', coachName: 'Coach Kyle Smith', school: 'Washington State', division: 'D1', email: 'ksmith@wsu.edu', sentAt: new Date(Date.now() - 12 * 86400000).toISOString(), daysSince: 12, followUpSent: false },
    { coachId: 'c6', coachName: 'Coach Mark Pope', school: 'BYU', division: 'D1', email: 'mpope@byu.edu', sentAt: new Date(Date.now() - 10 * 86400000).toISOString(), daysSince: 10, followUpSent: false },
    { coachId: 'c7', coachName: 'Coach Zac Selinger', school: 'Eastern Washington', division: 'D1', email: 'zselinger@ewu.edu', sentAt: new Date(Date.now() - 9 * 86400000).toISOString(), daysSince: 9, followUpSent: false },
    { coachId: 'c11', coachName: 'Coach Sam Purcell', school: 'Montana State', division: 'D1', email: 'spurcell@montana.edu', sentAt: new Date(Date.now() - 8 * 86400000).toISOString(), daysSince: 8, followUpSent: false },
    { coachId: 'c12', coachName: 'Coach Dan Monson', school: 'Idaho', division: 'D1', email: 'dmonson@uidaho.edu', sentAt: new Date(Date.now() - 7 * 86400000).toISOString(), daysSince: 7, followUpSent: false },
    { coachId: 'c13', coachName: 'Coach Kerry Rupp', school: 'Rocky Mountain College', division: 'NAIA', email: 'krupp@rocky.edu', sentAt: new Date(Date.now() - 6 * 86400000).toISOString(), daysSince: 6, followUpSent: false },
    { coachId: 'c14', coachName: 'Coach Brandon Rinta', school: 'Montana Tech', division: 'NAIA', email: 'brinta@mtech.edu', sentAt: new Date(Date.now() - 5 * 86400000).toISOString(), daysSince: 5, followUpSent: false },
  ];

  // Use API data if available, otherwise demo
  const stats = followUpData?.stats || demoStats;
  const templates = followUpData?.templates || demoTemplates;
  const responded = followUpData?.responded || demoResponded;
  const nonResponded = followUpData?.nonResponded || demoNonResponded;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 sticky top-0 z-50 bg-slate-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/hub/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{athlete.firstName} {athlete.lastName}</h1>
            <p className="text-sm text-slate-400">{athlete.sport} &bull; {athlete.position} &bull; {athlete.highSchool}</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Athlete Header Card */}
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 mb-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-4xl font-bold">{athlete.firstName.charAt(0)}{athlete.lastName.charAt(0)}</span>
              </div>
              <h2 className="text-2xl font-bold">{athlete.firstName} {athlete.lastName}</h2>
              <p className="text-slate-400 mt-2">{athlete.sport} &bull; {athlete.position}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase">Physical Stats</h3>
              <div className="space-y-3">
                <div><p className="text-xs text-slate-500">Height</p><p className="text-lg font-semibold">{athlete.height}</p></div>
                <div><p className="text-xs text-slate-500">Weight</p><p className="text-lg font-semibold">{athlete.weight} lbs</p></div>
                <div><p className="text-xs text-slate-500">School</p><p className="text-lg font-semibold">{athlete.highSchool}</p></div>
                <div><p className="text-xs text-slate-500">Grad Year</p><p className="text-lg font-semibold">{athlete.gradYear}</p></div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase">About</h3>
              <p className="text-slate-300 text-sm mb-4">{athlete.bio}</p>
              <p className="text-sm text-slate-400">{athlete.city}, {athlete.state}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-700 mb-8 overflow-x-auto">
          {(['profile', 'campaign', 'followups', 'responses', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              className={`px-4 py-3 font-medium text-sm transition border-b-2 whitespace-nowrap ${
                currentTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'followups' ? 'Follow-Ups' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ════════════ PROFILE TAB ════════════ */}
        {currentTab === 'profile' && (
          <div className="space-y-8">
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <h3 className="text-xl font-bold mb-4">Highlight Video</h3>
              {athlete.highlightUrl ? (
                <div className="bg-slate-900 rounded-lg p-6 aspect-video flex items-center justify-center border border-slate-700">
                  <div className="text-center">
                    <p className="text-slate-400 mb-3">Embedded video from HUDL</p>
                    <a href={athlete.highlightUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition">
                      Watch on HUDL <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              ) : (
                <button className="w-full p-8 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition text-center">
                  Upload Highlight Video
                </button>
              )}
            </div>
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <h3 className="text-xl font-bold mb-4">Bio</h3>
              <textarea defaultValue={athlete.bio} className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition" rows={4} />
              <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition">Save Bio</button>
            </div>
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <h3 className="text-xl font-bold mb-4">Photos</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-slate-700 rounded-lg border-2 border-dashed border-slate-600 hover:border-slate-500 transition flex items-center justify-center cursor-pointer">
                    <span className="text-slate-500">+</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════ CAMPAIGN TAB ════════════ */}
        {currentTab === 'campaign' && (
          <div className="space-y-8">
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Campaign Status</h3>
                <button
                  onClick={() => setCampaignStatus(campaignStatus === 'active' ? 'paused' : 'active')}
                  className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition ${
                    campaignStatus === 'active'
                      ? 'bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50'
                      : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700 hover:bg-yellow-900/50'
                  }`}
                >
                  {campaignStatus === 'active' ? <><Play size={16} /> Active</> : <><Pause size={16} /> Paused</>}
                </button>
              </div>
              <p className="text-slate-300 mb-4">
                {campaignStatus === 'active'
                  ? 'Your campaign is actively reaching out to coaches.'
                  : 'Your campaign is paused. No new outreach is happening.'}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { label: 'Total Sent', value: sendCount.total, sub: 'outreach attempts' },
                { label: 'This Week', value: sendCount.thisWeek, sub: 'outreach sent' },
                { label: 'Today', value: sendCount.today, sub: 'outreach sent' },
              ].map((s, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <p className="text-slate-400 text-sm mb-2">{s.label}</p>
                  <p className="text-3xl font-bold">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════ FOLLOW-UPS TAB ════════════ */}
        {currentTab === 'followups' && (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Sent', value: stats.totalSent, icon: <Mail size={16} /> },
                { label: 'Responded', value: stats.responded, icon: <CheckCircle size={16} className="text-green-400" /> },
                { label: 'No Response', value: stats.nonResponded, icon: <Clock size={16} className="text-yellow-400" /> },
                { label: 'Follow-Ups Sent', value: stats.followUpsSent + sentFollowUps.size, icon: <RefreshCw size={16} className="text-blue-400" /> },
                { label: 'Response Rate', value: `${stats.responseRate}%`, icon: <Users size={16} className="text-purple-400" /> },
              ].map((s, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">{s.icon} {s.label}</div>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setFollowUpView('no_response')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  followUpView === 'no_response'
                    ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
              >
                <Clock size={14} className="inline mr-2" />
                No Response ({nonResponded.length})
              </button>
              <button
                onClick={() => setFollowUpView('responded')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  followUpView === 'responded'
                    ? 'bg-green-900/40 text-green-300 border border-green-700'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
              >
                <CheckCircle size={14} className="inline mr-2" />
                Responded ({responded.length})
              </button>
            </div>

            {/* ── NO RESPONSE VIEW ── */}
            {followUpView === 'no_response' && (
              <div className="space-y-4">
                {/* Bulk Actions */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={selectAllNonResponded}
                      className="text-sm text-blue-400 hover:text-blue-300 transition"
                    >
                      Select All Eligible
                    </button>
                    {bulkSelected.size > 0 && (
                      <span className="text-sm text-slate-400">{bulkSelected.size} selected</span>
                    )}
                  </div>
                  {bulkSelected.size > 0 && (
                    <button
                      onClick={sendBulkFollowUps}
                      disabled={bulkSending}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition"
                    >
                      {bulkSending ? (
                        <><RefreshCw size={14} className="animate-spin" /> Sending...</>
                      ) : (
                        <><Send size={14} /> Send {bulkSelected.size} Follow-Ups</>
                      )}
                    </button>
                  )}
                </div>

                {/* Coach List */}
                {nonResponded.map((coach) => {
                  const isExpanded = expandedCoach === coach.coachId;
                  const isSent = coach.followUpSent || sentFollowUps.has(coach.coachId);
                  const isSending = sendingFollowUp === coach.coachId;

                  return (
                    <div key={coach.coachId} className={`bg-slate-800 rounded-lg border transition ${isSent ? 'border-green-700/50 opacity-60' : 'border-slate-700 hover:border-slate-600'}`}>
                      {/* Coach Row */}
                      <div className="p-4 flex items-center gap-4">
                        {!isSent && (
                          <input
                            type="checkbox"
                            checked={bulkSelected.has(coach.coachId)}
                            onChange={() => toggleBulkSelect(coach.coachId)}
                            className="w-4 h-4 rounded bg-slate-700 border-slate-600 cursor-pointer flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold truncate">{coach.coachName}</h4>
                            <span className={`px-2 py-0.5 text-xs rounded border ${getDivisionBadge(coach.division)}`}>{coach.division}</span>
                          </div>
                          <p className="text-sm text-slate-400 truncate">{coach.school}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {coach.daysSince !== null && (
                            <p className={`text-sm font-medium ${coach.daysSince >= 10 ? 'text-red-400' : coach.daysSince >= 7 ? 'text-yellow-400' : 'text-slate-400'}`}>
                              {coach.daysSince}d ago
                            </p>
                          )}
                          <p className="text-xs text-slate-500">sent</p>
                        </div>
                        <div className="flex-shrink-0">
                          {isSent ? (
                            <span className="text-green-400 text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Sent</span>
                          ) : (
                            <button
                              onClick={() => setExpandedCoach(isExpanded ? null : coach.coachId)}
                              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition text-sm"
                            >
                              <Edit3 size={14} />
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded: Edit + Send */}
                      {isExpanded && !isSent && (
                        <div className="border-t border-slate-700 p-4 space-y-3">
                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                            <AlertCircle size={12} />
                            Pre-populated follow-up — edit as needed before sending
                          </div>
                          <textarea
                            value={getFollowUpMessage(coach.coachId, 'no_response')}
                            onChange={(e) => setEditingMessage(prev => ({ ...prev, [coach.coachId]: e.target.value }))}
                            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 transition font-mono"
                            rows={12}
                          />
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setExpandedCoach(null)}
                              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => sendFollowUp(coach.coachId, getFollowUpMessage(coach.coachId, 'no_response'))}
                              disabled={isSending}
                              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-5 rounded-lg text-sm transition"
                            >
                              {isSending ? <><RefreshCw size={14} className="animate-spin" /> Sending...</> : <><Send size={14} /> Send Follow-Up</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {nonResponded.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
                    <p>All coaches have responded!</p>
                  </div>
                )}
              </div>
            )}

            {/* ── RESPONDED VIEW ── */}
            {followUpView === 'responded' && (
              <div className="space-y-4">
                {responded.map((coach) => {
                  const isExpanded = expandedCoach === coach.coachId;
                  const isSent = coach.followUpSent || sentFollowUps.has(coach.coachId);
                  const isSending = sendingFollowUp === coach.coachId;
                  const templateKey = coach.sentiment === 'positive' || coach.sentiment === 'interested'
                    ? 'responded_positive' : 'responded_neutral';

                  return (
                    <div key={coach.coachId} className={`bg-slate-800 rounded-lg border transition ${isSent ? 'border-green-700/50' : 'border-slate-700 hover:border-slate-600'}`}>
                      {/* Coach Row */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold">{coach.coachName}</h4>
                            <span className={`px-2 py-0.5 text-xs rounded border ${getDivisionBadge(coach.division)}`}>{coach.division}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${getSentimentColor(coach.sentiment)}`}>
                              {getSentimentLabel(coach.sentiment)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">{new Date(coach.respondedAt).toLocaleDateString()}</span>
                            {isSent ? (
                              <span className="text-green-400 text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Follow-Up Sent</span>
                            ) : coach.sentiment !== 'negative' ? (
                              <button
                                onClick={() => setExpandedCoach(isExpanded ? null : coach.coachId)}
                                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition text-sm"
                              >
                                <Send size={14} /> Follow Up
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-sm text-slate-400">{coach.school}</p>

                        {/* Coach's Response */}
                        <div className="mt-3 bg-slate-900/60 rounded-lg p-4 border border-slate-700/50">
                          <p className="text-xs text-slate-500 mb-1">Their Response:</p>
                          <p className="text-sm text-slate-300">{coach.responseBody}</p>
                        </div>
                      </div>

                      {/* Expanded: Follow-up editor */}
                      {isExpanded && !isSent && (
                        <div className="border-t border-slate-700 p-4 space-y-3">
                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                            <AlertCircle size={12} />
                            Pre-populated based on their response — edit before sending
                          </div>
                          <textarea
                            value={getFollowUpMessage(coach.coachId, templateKey)}
                            onChange={(e) => setEditingMessage(prev => ({ ...prev, [coach.coachId]: e.target.value }))}
                            className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 transition font-mono"
                            rows={10}
                          />
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setExpandedCoach(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition">Cancel</button>
                            <button
                              onClick={() => sendFollowUp(coach.coachId, getFollowUpMessage(coach.coachId, templateKey))}
                              disabled={isSending}
                              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-5 rounded-lg text-sm transition"
                            >
                              {isSending ? <><RefreshCw size={14} className="animate-spin" /> Sending...</> : <><Send size={14} /> Send Follow-Up</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {responded.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <XCircle size={40} className="mx-auto mb-3" />
                    <p>No responses yet. Keep the campaign running!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════ RESPONSES TAB (legacy, simple list) ════════════ */}
        {currentTab === 'responses' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <p className="text-slate-400">{responded.length} responses from coaches — see <button onClick={() => setCurrentTab('followups')} className="text-blue-400 hover:text-blue-300 underline">Follow-Ups tab</button> to manage</p>
            </div>
            {responded.map((response) => (
              <div key={response.responseId} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{response.coachName}</h3>
                    <p className="text-sm text-slate-400">{response.school}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSentimentColor(response.sentiment)}`}>
                    {getSentimentLabel(response.sentiment)}
                  </span>
                </div>
                <p className="text-slate-300 mb-3">{response.responseBody}</p>
                <p className="text-xs text-slate-500">{new Date(response.respondedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* ════════════ SETTINGS TAB ════════════ */}
        {currentTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Connect X Account</h3>
                {athlete.xConnected ? (
                  <span className="text-green-400 text-sm font-semibold">Connected</span>
                ) : (
                  <span className="text-slate-400 text-sm font-semibold">Not Connected</span>
                )}
              </div>
              <p className="text-slate-300 mb-6">Connecting your X account allows us to amplify your profile and reach more coaches.</p>
              {!athlete.xConnected ? (
                <a href={`/api/auth/x/authorize?athleteId=${athlete.id}`} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.694L2.306 21.75H-.012l7.644-8.769L.424 2.25h6.679l4.882 6.479L18.244 2.25zM17.474 20.451h1.829L6.75 3.75H4.794l12.68 16.701z"/></svg>
                  Connect X Account
                </a>
              ) : (
                <button className="text-red-400 hover:text-red-300 transition font-semibold">Disconnect X Account</button>
              )}
            </div>
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Bell size={20} /> Notification Settings</h3>
              <div className="space-y-4">
                {[
                  { label: 'New Coach Response', enabled: true },
                  { label: 'Weekly Summary', enabled: true },
                  { label: 'Campaign Paused (no coaches in queue)', enabled: false },
                ].map((setting, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked={setting.enabled} className="w-4 h-4 rounded bg-slate-700 border-slate-600 cursor-pointer" />
                    <span className="text-slate-300">{setting.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Lock size={20} /> Privacy</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked={false} className="w-4 h-4 rounded bg-slate-700 border-slate-600 cursor-pointer" />
                <span className="text-slate-300">Make profile private (coaches cannot view)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-800 mt-20 py-8 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          <p>&copy; 2025 LocalHustle. Athlete recruitment management.</p>
        </div>
      </footer>
    </div>
  );
}
