import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import notificationSound from '@/assets/sounds/notification.mp3';

let audio: HTMLAudioElement | null = null;
let permissionChecked = false;

function playSound() {
  if (!audio) {
    audio = new Audio(notificationSound);
    audio.volume = 0.5;
  }
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

async function ensurePermission() {
  if (permissionChecked) return;
  permissionChecked = true;
  const granted = await isPermissionGranted();
  if (!granted) await requestPermission();
}

/**
 * Sends an OS notification with a custom sound played via webview audio.
 *
 * Handles permission request automatically on first call.
 * Tauri's native `sound` param only works with bundled .aiff in production builds,
 * so we play the mp3 through the webview as a cross-environment workaround.
 */
export async function notify(options: { title: string; body: string }) {
  await ensurePermission();
  playSound();
  await sendNotification(options);
}
