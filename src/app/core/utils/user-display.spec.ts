import { designation, displayName, initials } from './user-display';
import { User } from '../models/auth.model';

const user = (over: Partial<User> = {}): User => ({ id: 'u1', email: 'asha@clinic.test', role: 'HOSPITAL_ADMIN', ...over });

describe('user display', () => {
  it('shows the name, or the email when there is none', () => {
    expect(displayName(user({ profile: { firstName: 'Asha', lastName: 'Rao' } }))).toBe('Asha Rao');
    expect(displayName(user({ profile: { firstName: 'Asha', lastName: '' } }))).toBe('Asha');
    expect(displayName(user())).toBe('asha@clinic.test');
    expect(displayName(null)).toBe('');
  });

  it("shows the clinic's name for the role, and a doctor's specialisation", () => {
    expect(designation(user({ roleName: 'Hospital admin' }))).toBe('Hospital admin');
    expect(designation(user({ role: 'LAB_TECHNICIAN' }))).toBe('Lab technician');
    expect(designation(user({ role: 'DOCTOR', roleName: 'Doctor', profile: { firstName: 'Ravi', lastName: 'K', specialization: 'Cardiology' } })))
      .toBe('Doctor, Cardiology');
    expect(designation(user({ roleName: 'Senior nurse' }))).toBe('Senior nurse');
  });

  it('makes avatar initials from the name or the email', () => {
    expect(initials(user({ profile: { firstName: 'asha', lastName: 'rao' } }))).toBe('AR');
    expect(initials(user())).toBe('A');
    expect(initials(undefined)).toBe('?');
  });
});
