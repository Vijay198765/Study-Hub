import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const VAPID_PUBLIC_KEY = 'BKT1ZB7Mhnw0JtUI73xwb_bKSWsMRIHc_n13mkg3IyaXMpjTgaXIUFiJLyLAx9yCJ-5CGtBmiHpo0xAMW-yKuos';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported in this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('User subscribed:', subscription);

    // Save subscription to Firestore
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        pushSubscriptions: arrayUnion(JSON.stringify(subscription))
      });
    }
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
  }
}
