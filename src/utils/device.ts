export type DeviceType = 'mobile' | 'desktop' | 'tablet';

export function detectDevice(): DeviceType {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  // Tablet detection (orden importa: tablet antes que mobile porque iPad puede tener "Mobile" UA)
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android.*Mobile|iPhone|iPod|Opera Mini/i.test(ua)) return 'mobile';
  return 'desktop';
}
