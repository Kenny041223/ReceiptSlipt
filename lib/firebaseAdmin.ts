import { cert, getApps, initializeApp, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!b64) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable')

  const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))
  return initializeApp({ credential: cert(serviceAccount) })
}

export const adminAuth = () => getAuth(getAdminApp())
export const adminDb = () => getFirestore(getAdminApp())
