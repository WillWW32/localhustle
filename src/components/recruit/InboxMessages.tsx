'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ── Types ──
interface InboxMessage {
  id: string
  athlete_id: string
  coach_id: string | null
  direction: 'inbound' | 'outbound'
  channel: 'email' | 'dm'
  from_address: string | null
  to_address: string | null
  subject: string | null
  body: string
  html_body: string | null
  is_read: boolean
  resend_email_id: string | null
  x_message_id: string | null
  created_at: string
  updated_at: string
}

interface Thread {
  coachId: string
  coachName: string
  school: string
  coachEmail: string
  lastMessagePreview: string
  lastMessageSubject: string
  lastMessageDirection: string
  lastMessageChannel: string
  unreadCount: number
  lastActivity: string
  messages: InboxMessage[]
}

interface InboxMessagesProps {
  athleteId: string
  athleteFirstName: string
  athleteLastName: string
  xConnected: boolean
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// ── Email SVG Icon ──
function EmailIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

// ── X/DM SVG Icon ──
function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

// ── Send Icon ──
function SendIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

export default function InboxMessages({ athleteId, athleteFirstName, athleteLastName, xConnected }: InboxMessagesProps) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyChannel, setReplyChannel] = useState<'email' | 'dm'>('email')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetch(`/api/recruit/inbox?athleteId=${athleteId}`)
      if (res.ok) {
        const data = await res.json()
        setThreads(data.threads || [])
        setTotalUnread(data.totalUnread || 0)
        // If we have a selected thread, update it with fresh data
        if (selectedThread) {
          const updated = (data.threads || []).find((t: Thread) => t.coachId === selectedThread.coachId)
          if (updated) setSelectedThread(updated)
        }
      }
    } catch (err) {
      console.error('Failed to fetch inbox:', err)
    } finally {
      setLoading(false)
    }
  }, [athleteId, selectedThread])

  useEffect(() => {
    fetchInbox()
  }, [athleteId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedThread?.messages])

  // Mark unread messages as read when a thread is selected
  const markAsRead = useCallback(async (thread: Thread) => {
    const unreadIds = thread.messages
      .filter((m) => !m.is_read && m.direction === 'inbound')
      .map((m) => m.id)

    if (unreadIds.length === 0) return

    try {
      await fetch('/api/recruit/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, messageIds: unreadIds }),
      })
      // Update local state
      setThreads((prev) =>
        prev.map((t) =>
          t.coachId === thread.coachId
            ? {
                ...t,
                unreadCount: 0,
                messages: t.messages.map((m) => (unreadIds.includes(m.id) ? { ...m, is_read: true } : m)),
              }
            : t
        )
      )
      setTotalUnread((prev) => Math.max(0, prev - unreadIds.length))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }, [athleteId])

  const selectThread = (thread: Thread) => {
    setSelectedThread(thread)
    setReplyText('')
    markAsRead(thread)
  }

  const handleSendReply = async () => {
    if (!selectedThread || !replyText.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/recruit/inbox/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId,
          coachId: selectedThread.coachId,
          message: replyText.trim(),
          channel: replyChannel,
        }),
      })

      if (res.ok) {
        setReplyText('')
        // Refresh inbox to show the new message
        await fetchInbox()
      } else {
        const err = await res.json()
        alert('Failed to send: ' + (err.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('Send reply error:', err)
      alert('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const filteredThreads = searchQuery.trim()
    ? threads.filter(
        (t) =>
          t.coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.lastMessagePreview.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : threads

  // ── Styles ──
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    height: '70vh',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#fff',
    fontFamily: 'inherit',
  }

  const leftPanelStyle: React.CSSProperties = {
    width: '35%',
    minWidth: '280px',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    background: '#fafafa',
  }

  const rightPanelStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
  }

  const threadItemStyle = (isSelected: boolean, hasUnread: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    background: isSelected ? '#f0f4ff' : 'transparent',
    transition: 'background 0.15s',
    fontWeight: hasUnread ? 700 : 400,
  })

  const bubbleStyle = (direction: 'inbound' | 'outbound'): React.CSSProperties => ({
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: direction === 'outbound' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: direction === 'outbound' ? '#007AFF' : '#e9e9eb',
    color: direction === 'outbound' ? '#fff' : '#1a1a1a',
    fontSize: '0.875rem',
    lineHeight: '1.4',
    wordBreak: 'break-word',
    alignSelf: direction === 'outbound' ? 'flex-end' : 'flex-start',
  })

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>
        Loading messages...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Messages</h2>
        {totalUnread > 0 && (
          <span
            style={{
              background: '#007AFF',
              color: '#fff',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {totalUnread}
          </span>
        )}
      </div>

      <div style={containerStyle}>
        {/* Left Panel — Thread List */}
        <div style={leftPanelStyle}>
          {/* Search */}
          <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none',
                background: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Thread list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredThreads.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.875rem' }}>
                {searchQuery ? 'No matching conversations' : 'No messages yet'}
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.coachId}
                  onClick={() => selectThread(thread)}
                  style={threadItemStyle(selectedThread?.coachId === thread.coachId, thread.unreadCount > 0)}
                  onMouseEnter={(e) => {
                    if (selectedThread?.coachId !== thread.coachId) {
                      e.currentTarget.style.background = '#f5f5f5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedThread?.coachId !== thread.coachId) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: thread.unreadCount > 0 ? 700 : 600, color: '#1a1a1a' }}>
                          {thread.coachName}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#999' }}>
                          {thread.lastMessageChannel === 'dm' ? <XIcon size={12} /> : <EmailIcon size={12} />}
                        </span>
                      </div>
                      {thread.school && (
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>
                          {thread.school}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: thread.unreadCount > 0 ? '#333' : '#999',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {thread.lastMessageDirection === 'outbound' && (
                          <span style={{ color: '#999' }}>You: </span>
                        )}
                        {thread.lastMessagePreview}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.7rem', color: '#999', whiteSpace: 'nowrap' }}>
                        {timeAgo(thread.lastActivity)}
                      </span>
                      {thread.unreadCount > 0 && (
                        <span
                          style={{
                            background: '#007AFF',
                            color: '#fff',
                            borderRadius: '10px',
                            padding: '1px 6px',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            minWidth: '16px',
                            textAlign: 'center',
                          }}
                        >
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel — Conversation */}
        <div style={rightPanelStyle}>
          {!selectedThread ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '0.9rem',
              }}
            >
              Select a conversation to view messages
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #e0e0e0',
                  background: '#fafafa',
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1a1a1a' }}>
                  {selectedThread.coachName}
                </div>
                {selectedThread.school && (
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                    {selectedThread.school}
                    {selectedThread.coachEmail && ` — ${selectedThread.coachEmail}`}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {selectedThread.messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.direction === 'outbound' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {/* Subject line for email messages */}
                    {msg.subject && msg.channel === 'email' && (
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#999',
                          marginBottom: '2px',
                          maxWidth: '75%',
                        }}
                      >
                        {msg.subject}
                      </div>
                    )}
                    <div style={bubbleStyle(msg.direction)}>
                      {msg.body}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '2px',
                        fontSize: '0.65rem',
                        color: '#aaa',
                      }}
                    >
                      <span>{formatTimestamp(msg.created_at)}</span>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {msg.channel === 'dm' ? <XIcon size={10} /> : <EmailIcon size={10} />}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid #e0e0e0',
                  background: '#fafafa',
                }}
              >
                {/* Channel toggle */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    onClick={() => setReplyChannel('email')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: replyChannel === 'email' ? '1.5px solid #007AFF' : '1px solid #ddd',
                      background: replyChannel === 'email' ? '#e8f0fe' : '#fff',
                      color: replyChannel === 'email' ? '#007AFF' : '#666',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <EmailIcon size={12} /> Email
                  </button>
                  <button
                    onClick={() => setReplyChannel('dm')}
                    disabled={!xConnected}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: replyChannel === 'dm' ? '1.5px solid #007AFF' : '1px solid #ddd',
                      background: replyChannel === 'dm' ? '#e8f0fe' : '#fff',
                      color: !xConnected ? '#ccc' : replyChannel === 'dm' ? '#007AFF' : '#666',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: xConnected ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                      opacity: xConnected ? 1 : 0.5,
                    }}
                  >
                    <XIcon size={12} /> DM
                  </button>
                </div>

                {/* Input + Send */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply via ${replyChannel === 'email' ? 'email' : 'X DM'}...`}
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault()
                        handleSendReply()
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      lineHeight: '1.4',
                    }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: replyText.trim() && !sending ? '#007AFF' : '#e0e0e0',
                      color: replyText.trim() && !sending ? '#fff' : '#999',
                      cursor: replyText.trim() && !sending ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}
                  >
                    <SendIcon size={18} />
                  </button>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#bbb', marginTop: '4px' }}>
                  {replyChannel === 'email'
                    ? `Sending as ${athleteFirstName.toLowerCase()}.${athleteLastName.toLowerCase()}@localhustle.org`
                    : 'Sending via X DM'}
                  {' — '}Cmd+Enter to send
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
