export function mask(value: string | undefined | null, type: 'customerName' | 'cif' | 'phone'): string {
  if (!value) return '';
  switch (type) {
    case 'customerName':
      // Keep first and last name, mask middle
      const parts = value.split(' ');
      if (parts.length <= 1) return value.substring(0, 2) + '***';
      return parts[0] + ' ' + '*'.repeat(Math.max(1, parts.length - 2) * 3) + ' ' + parts[parts.length - 1];
    case 'cif':
      // Mask middle, keep first 2 and last 2
      if (value.length <= 4) return '***';
      return value.substring(0, 2) + '***' + value.substring(value.length - 2);
    case 'phone':
      // Mask middle, keep first 3 and last 3
      if (value.length <= 6) return '***';
      return value.substring(0, 3) + '***' + value.substring(value.length - 3);
    default:
      return value;
  }
}
