import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { UserManagementService } from '../../../../core/services/user-management.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ManagedUser } from '../../../../core/models/user-management.model';
import { UserListComponent, generatePassword } from './user-list';

const user = (id: string, over: Partial<ManagedUser> = {}): ManagedUser => ({
  id, email: `${id}@clinic.test`, firstName: 'Meera', lastName: 'Nair', roles: 'RECEPTIONIST', isActive: true, createdAt: '', ...over,
});
const paged = (content: ManagedUser[]) => ({ content, pageNumber: 0, pageSize: 20, totalElements: content.length, totalPages: 1, last: true });

describe('generatePassword', () => {
  it('has the requested length and one of each kind of character', () => {
    for (let i = 0; i < 50; i++) {
      const p = generatePassword();
      expect(p).toHaveLength(16);
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/[0-9]/);
      expect(p).toMatch(/[#$%&*?]/);
    }
  });

  it('is different every time', () => {
    expect(new Set(Array.from({ length: 30 }, () => generatePassword())).size).toBe(30);
  });
});

describe('UserListComponent', () => {
  let service: Record<string, ReturnType<typeof vi.fn>>;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  function create(users = [user('u1'), user('me', { firstName: 'Live', lastName: 'Admin', roles: 'ADMIN' })]) {
    service = {
      getUsers: vi.fn().mockReturnValue(of(paged(users))),
      createUser: vi.fn().mockReturnValue(of(user('new'))),
      deactivateUser: vi.fn().mockReturnValue(of(void 0)),
      activateUser: vi.fn().mockReturnValue(of(void 0)),
      resetPassword: vi.fn().mockReturnValue(of({ temporaryPassword: 'Tmp#Pass1234' })),
    };
    toast = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: UserManagementService, useValue: service },
        { provide: AuthService, useValue: { currentUserValue: { id: 'me', role: 'ADMIN' } } },
        { provide: ToastService, useValue: toast },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new UserListComponent());
    component.ngOnInit();
    return component;
  }

  it('lists the clinic staff', () => {
    const component = create();
    expect(component.users.map((u) => u.id)).toEqual(['u1', 'me']);
    expect(component.totalElements).toBe(2);
    expect(component.isLoading).toBe(false);
  });

  it('shows a name, or a dash when none was ever recorded', () => {
    const component = create();
    expect(component.nameOf(user('a'))).toBe('Meera Nair');
    expect(component.nameOf(user('b', { firstName: null, lastName: null }))).toBe('—');
    expect(component.nameOf(user('c', { firstName: 'Solo', lastName: '' }))).toBe('Solo');
  });

  it('recognises the signed-in administrator, who cannot deactivate themselves', () => {
    const component = create();
    expect(component.isSelf(user('me'))).toBe(true);
    expect(component.isSelf(user('u1'))).toBe(false);
  });

  it('reports why the list could not load, and clears the message on a successful retry', () => {
    const component = create();
    service['getUsers'].mockReturnValue(throwError(() => ({ error: { message: 'Module is not active: USER' } })));
    component.load();
    expect(component.loadError).toBe('Module is not active: USER');
    service['getUsers'].mockReturnValue(of(paged([user('u1')])));
    component.load();
    expect(component.loadError).toBe('');
  });

  describe('adding a user', () => {
    function fill(component: UserListComponent) {
      component.openForm();
      component.form.setValue({ firstName: ' Meera ', lastName: 'Nair', email: 'desk@clinic.test', role: 'RECEPTIONIST', phone: '' });
    }

    it('sends the trimmed details with a generated password, then reloads the list', () => {
      const component = create();
      fill(component);
      component.submit();
      const sent = service['createUser'].mock.calls[0][0];
      expect(sent).toMatchObject({ firstName: 'Meera', lastName: 'Nair', email: 'desk@clinic.test', role: 'RECEPTIONIST', phone: undefined });
      expect(sent.password).toHaveLength(16);
      expect(component.showForm).toBe(false);
      expect(toast.success).toHaveBeenCalledWith('new@clinic.test added');
      expect(service['getUsers'].mock.calls.length).toBe(2);
    });

    it('does not submit an incomplete form', () => {
      const component = create();
      component.openForm();
      component.form.patchValue({ email: 'not-an-email' });
      component.submit();
      expect(service['createUser']).not.toHaveBeenCalled();
    });

    it('says the email is taken on a 409 and keeps the form open', () => {
      const component = create();
      fill(component);
      service['createUser'].mockReturnValue(throwError(() => ({ status: 409 })));
      component.submit();
      expect(component.formError).toBe('A user with this email already exists.');
      expect(component.showForm).toBe(true);
      expect(component.isSaving).toBe(false);
    });

    it('shows the server reason for other failures, such as a plan limit', () => {
      const component = create();
      fill(component);
      service['createUser'].mockReturnValue(throwError(() => ({ status: 403, error: { message: 'Doctor limit reached for your plan' } })));
      component.submit();
      expect(component.formError).toBe('Doctor limit reached for your plan');
    });

    it('ignores a second submit while one is saving', () => {
      const component = create();
      fill(component);
      component.isSaving = true;
      component.submit();
      expect(service['createUser']).not.toHaveBeenCalled();
    });
  });

  describe('deactivating, activating and resetting', () => {
    it('deactivates only after confirmation', () => {
      const component = create();
      component.askDeactivate(user('u1'));
      expect(service['deactivateUser']).not.toHaveBeenCalled();
      component.deactivate();
      expect(service['deactivateUser']).toHaveBeenCalledWith('u1');
      expect(toast.success).toHaveBeenCalledWith('u1@clinic.test deactivated');
      expect(component.toDeactivate).toBeNull();
    });

    it('shows the server reason when deactivation is refused', () => {
      const component = create();
      service['deactivateUser'].mockReturnValue(throwError(() => ({ error: { message: 'You cannot deactivate your own account.' } })));
      component.askDeactivate(user('u1'));
      component.deactivate();
      expect(toast.error).toHaveBeenCalledWith('You cannot deactivate your own account.');
    });

    it('activates a user and reloads', () => {
      const component = create();
      component.activate(user('u1', { isActive: false }));
      expect(service['activateUser']).toHaveBeenCalledWith('u1');
      expect(toast.success).toHaveBeenCalledWith('u1@clinic.test activated');
    });

    it('shows the temporary password once, addressed to the person', () => {
      const component = create();
      component.resetPassword(user('u1'));
      expect(component.issuedPassword).toBe('Tmp#Pass1234');
      expect(component.issuedFor).toBe('Meera Nair');
    });

    it('addresses the password to the email when the user has no name', () => {
      const component = create();
      component.resetPassword(user('u2', { firstName: null, lastName: null }));
      expect(component.issuedFor).toBe('u2@clinic.test');
    });
  });
});
