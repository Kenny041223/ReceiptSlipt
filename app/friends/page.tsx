'use client'

import { useState } from 'react'
import { useFriends } from '@/hooks/useFriends'
import { avatarGradient, initials } from '@/lib/avatar'
import { ProfileIcon } from '@/components/Icons'

export default function FriendsPage() {
  const { friends, loading, error, addFriend, removeFriend } = useFriends()
  const [input, setInput] = useState('')

  const add = async () => {
    const name = input.trim()
    if (!name) return
    setInput('')
    await addFriend(name)
  }

  return (
    <div className="page page--narrow">
      <div className="section-label">
        <div>
          <p className="eyebrow">Your crew</p>
          <h1 className="display" style={{ fontSize: 30, marginTop: 6 }}>Friends</h1>
        </div>
        <span className="scan-pill">{friends.length} saved</span>
      </div>

      <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
        <div className="addrow">
          <input
            className="field"
            placeholder="Add a friend's name"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
          />
          <button className="btn btn--primary btn--sm" onClick={add}>Add</button>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 12, marginBottom: 0 }}>
          Saved friends join every new split automatically — no more retyping names.
        </p>
      </div>

      {error && <p className="auth-err" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="glass" style={{ padding: 24 }}>
        {loading ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: '40px 0' }}>
            <div className="spinner" />
          </div>
        ) : friends.length === 0 ? (
          <div className="preview-empty">
            <ProfileIcon />
            <div style={{ fontSize: 14 }}>No friends saved yet — add the people you split with most.</div>
          </div>
        ) : (
          <div className="roster__avatars" style={{ gap: 20 }}>
            {friends.map(f => (
              <div key={f.id} className="roster__person" style={{ width: 72, cursor: 'default' }}>
                <button className="roster__remove" title={`Remove ${f.name}`} onClick={() => removeFriend(f.id)}>×</button>
                <span className="av av--xl" style={{ background: avatarGradient(f.name) }}>{initials(f.name)}</span>
                <span className="roster__name">{f.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
