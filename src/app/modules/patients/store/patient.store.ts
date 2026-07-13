import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../core/models/patient.model';
import { ApiResponse, PagedResponse } from '../../../core/models/common.model';

export interface PatientState {
  patients: Patient[];
  selectedPatient: Patient | null;
  loading: boolean;
  error: string | null;
  totalElements: number;
  currentPage: number;
}

const initialState: PatientState = {
  patients: [],
  selectedPatient: null,
  loading: false,
  error: null,
  totalElements: 0,
  currentPage: 0
};

export const PatientStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    hasPatients: computed(() => state.patients().length > 0)
  })),
  withMethods((store) => {
    const patientService = inject(PatientService);
    return {
    loadPatients: rxMethod<{ page?: number; size?: number } | void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((params) =>
          patientService.getPatients(params?.page || 0, params?.size || 20).pipe(
            tap((response: ApiResponse<PagedResponse<Patient>>) => {
              patchState(store, {
                patients: response.data.content,
                totalElements: response.data.totalElements,
                currentPage: response.data.pageNumber,
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

    loadPatient: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((id) =>
          patientService.getPatientById(id).pipe(
            tap((response: ApiResponse<Patient>) => {
              patchState(store, { selectedPatient: response.data, loading: false });
            }),
            catchError((error) => {
              patchState(store, { error: error.message, loading: false });
              return EMPTY;
            })
          )
        )
      )
    ),

    createPatient: rxMethod<Partial<Patient>>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((patient) =>
          patientService.createPatient(patient as Patient).pipe(
            tap((response: ApiResponse<Patient>) => {
              patchState(store, (state) => ({
                patients: [response.data, ...state.patients],
                totalElements: state.totalElements + 1,
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

    updatePatient: rxMethod<{ id: string; patient: Partial<Patient> }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ id, patient }) =>
          patientService.updatePatient(id, patient).pipe(
            tap((response: ApiResponse<Patient>) => {
              patchState(store, (state) => ({
                patients: state.patients.map((p) => (p.id === id ? response.data : p)),
                selectedPatient: state.selectedPatient?.id === id ? response.data : state.selectedPatient,
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

    clearSelectedPatient: () => {
      patchState(store, { selectedPatient: null });
    },

    clearError: () => {
      patchState(store, { error: null });
    }
  };
})
);
