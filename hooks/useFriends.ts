'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore'

export interface Friend {
  id: string
  name: string
}

export function useFriends() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const snap = await getDocs(query(collection(db, 'users', user.uid, 'friends'), orderBy('name')))
      setFriends(snap.docs.map(d => ({ id: d.id, name: (d.data() as { name: string }).name })))
      setError('')
    } catch {
      setError('Could not load friends — make sure the Firestore rules are published.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const addFriend = async (name: string) => {
    if (!user) return
    const trimmed = name.trim()
    if (!trimmed || friends.some(f => f.name.toLowerCase() === trimmed.toLowerCase())) return
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'friends'), {
        name: trimmed,
        createdAt: serverTimestamp(),
      })
      setFriends(prev => [...prev, { id: ref.id, name: trimmed }].sort((a, b) => a.name.localeCompare(b.name)))
      setError('')
    } catch {
      setError('Could not save friend — make sure the Firestore rules are published.')
    }
  }

  const removeFriend = async (id: string) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'friends', id))
      setFriends(prev => prev.filter(f => f.id !== id))
    } catch {
      setError('Could not remove friend.')
    }
  }

  return { friends, loading, error, addFriend, removeFriend }
}
