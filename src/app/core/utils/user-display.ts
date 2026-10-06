import { User } from '../models/auth.model';

/** The signed-in person's name as shown in the app; the email when no name was given. */
export function displayName(user: User | null | undefined): string {
  if (!user) return '';
  const name = [user.profile?.['firstName'], user.profile?.['lastName']].filter((p) => !!p?.trim()).join(' ').trim();
  return name || user.email;
}

/**
 * Their title: the clinic's name for their role (a custom role's own name, or "Hospital admin"), and for a doctor
 * the specialisation too ("Doctor, Cardiology").
 */
export function designation(user: User | null | undefined): string {
  if (!user) return '';
  const role = user.roleName || user.role.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  const specialization = user.profile?.['specialization']?.trim();
  return specialization ? `${role}, ${specialization}` : role;
}

/** One or two letters for the avatar. */
export function initials(user: User | null | undefined): string {
  if (!user) return '?';
  const first = user.profile?.['firstName']?.trim().charAt(0) ?? '';
  const last = user.profile?.['lastName']?.trim().charAt(0) ?? '';
  return (first + last || user.email.charAt(0) || '?').toUpperCase();
}
