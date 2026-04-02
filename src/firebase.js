import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCnbDNCBXmpReXseMXq31T6khwEvtzNZvs",
  authDomain: "ssc-map-app-c31fd.firebaseapp.com",
  projectId: "ssc-map-app-c31fd",
  storageBucket: "ssc-map-app-c31fd.firebasestorage.app",
  messagingSenderId: "875906321741",
  appId: "1:875906321741:web:b9219ae2b34bc45e893b04"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
