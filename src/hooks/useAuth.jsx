import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { STORAGE_KEYS } from '../constants/storageKeys'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        setFirstName(snap.exists() ? snap.data().firstName : '')
        setUser(firebaseUser)
      } else {
        setUser(null)
        setFirstName('')
      }
      setLoading(false)
    })
  }, [])

  async function signUp(email, password, first) {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'users', newUser.uid), { firstName: first })
    setFirstName(first)
  }

  async function signIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  async function updateFirstName(newFirst) {
    await updateDoc(doc(db, 'users', user.uid), { firstName: newFirst })
    setFirstName(newFirst)
  }

  async function updateCredentials({ currentPassword, newEmail, newPassword }) {
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(auth.currentUser, credential)
    if (newEmail) await updateEmail(auth.currentUser, newEmail)
    if (newPassword) await updatePassword(auth.currentUser, newPassword)
  }

  async function deleteAccount(currentPassword) {
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(auth.currentUser, credential)
    await deleteDoc(doc(db, 'users', user.uid))
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
    await deleteUser(auth.currentUser)
  }

  return (
    <AuthContext.Provider value={{ user, firstName, loading, signUp, signIn, signOut, updateFirstName, updateCredentials, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
