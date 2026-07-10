import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { PrescriptionService } from '../../../core/services/prescription.service';
import { Prescription, CreatePrescriptionRequest } from '../../../core/models/prescription.model';
import { ApiResponse, PagedResponse } from '../../../core/models/common.model';

export interface PrescriptionState {
  prescriptions: Prescription[];
  selectedPrescription: Prescription | null;
  loading: boolean;
  error: string | null;
  totalElements: number;
  currentPage: number;
}

const initialState: PrescriptionState = {
  prescriptions: [],
  selectedPrescription: null,
  loading: false,
  error: null,
  totalElements: 0,
  currentPage: 0
};

export const PrescriptionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    hasPrescriptions: computed(() => state.prescriptions().length > 0)
  })),
  withMethods((store) => {
    const prescriptionService = inject(PrescriptionService);
    return {
      loadPrescriptions: rxMethod<{ page?: number; size?: number } | void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((params) =>
            prescriptionService.getPrescriptions(params?.page || 0, params?.size || 20).pipe(
              tap((response: ApiResponse<PagedResponse<Prescription>>) => {
                patchState(store, {
                  prescriptions: response.data.content,
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

      loadPrescription: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((id) =>
            prescriptionService.getPrescriptionById(id).pipe(
              tap((response: ApiResponse<Prescription>) => {
                patchState(store, { selectedPrescription: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      loadPrescriptionsByPatient: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((patientId) =>
            prescriptionService.getPrescriptionsByPatient(patientId).pipe(
              tap((response: ApiResponse<Prescription[]>) => {
                patchState(store, { prescriptions: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      createPrescription: rxMethod<CreatePrescriptionRequest>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((prescription) =>
            prescriptionService.createPrescription(prescription as CreatePrescriptionRequest).pipe(
              tap((response: ApiResponse<Prescription>) => {
                patchState(store, (state) => ({
                  prescriptions: [response.data, ...state.prescriptions],
                  selectedPrescription: response.data,
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

      clearSelectedPrescription: () => {
        patchState(store, { selectedPrescription: null });
      },

      clearError: () => {
        patchState(store, { error: null });
      }
    };
  })
);

