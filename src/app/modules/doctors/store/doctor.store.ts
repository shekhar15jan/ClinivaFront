import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { DoctorService } from '../../../core/services/doctor.service';
import { Doctor } from '../../../core/models/doctor.model';

export interface DoctorState {
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  loading: boolean;
  error: string | null;
}

const initialState: DoctorState = {
  doctors: [],
  selectedDoctor: null,
  loading: false,
  error: null
};

export const DoctorStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    hasDoctors: computed(() => state.doctors().length > 0),
    activeDoctors: computed(() => state.doctors().filter((d) => d.isActive))
  })),
  withMethods((store) => {
    const doctorService = inject(DoctorService);
    return {
      loadDoctors: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            doctorService.getDoctors().pipe(
              tap((response) => {
                patchState(store, {
                  doctors: response.data,
                  loading: false
                });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      loadDoctor: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((id) =>
            doctorService.getDoctorById(id).pipe(
              tap((response) => {
                patchState(store, { selectedDoctor: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      createDoctor: rxMethod<Partial<Doctor>>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((doctor) =>
            doctorService.createDoctor(doctor).pipe(
              tap((response) => {
                patchState(store, (state) => ({
                  doctors: [...state.doctors, response.data],
                  loading: false
                }));
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      updateDoctor: rxMethod<{ id: string; doctor: Partial<Doctor> }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(({ id, doctor }) =>
            doctorService.updateDoctor(id, doctor).pipe(
              tap((response) => {
                patchState(store, (state) => ({
                  doctors: state.doctors.map((d) => (d.id === id ? response.data : d)),
                  selectedDoctor: state.selectedDoctor?.id === id ? response.data : state.selectedDoctor,
                  loading: false
                }));
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      clearSelectedDoctor: () => {
        patchState(store, { selectedDoctor: null });
      },

      clearError: () => {
        patchState(store, { error: null });
      }
    };
  })
);
