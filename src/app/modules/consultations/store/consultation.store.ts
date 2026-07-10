import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { ConsultationService } from '../../../core/services/consultation.service';
import { Consultation, Vitals, CreateConsultationRequest } from '../../../core/models/consultation.model';
import { ApiResponse } from '../../../core/models/common.model';

export interface ConsultationState {
  consultation: Consultation | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConsultationState = {
  consultation: null,
  loading: false,
  error: null
};

export const ConsultationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const consultationService = inject(ConsultationService);
    return {
      loadConsultation: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((appointmentId) =>
            consultationService.getByAppointment(appointmentId).pipe(
              tap((response: ApiResponse<Consultation>) => {
                patchState(store, { consultation: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      createConsultation: rxMethod<CreateConsultationRequest>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((consultation) =>
            consultationService.createConsultation(consultation as CreateConsultationRequest).pipe(
              tap((response: ApiResponse<Consultation>) => {
                patchState(store, { consultation: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      updateConsultation: rxMethod<{ id: string; consultation: Partial<Consultation> }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(({ id, consultation }) =>
            consultationService.updateConsultation(id, consultation).pipe(
              tap((response: ApiResponse<Consultation>) => {
                patchState(store, { consultation: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      recordVitals: rxMethod<{ appointmentId: string; vitals: Vitals }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(({ appointmentId, vitals }) =>
            consultationService.recordVitals(appointmentId, vitals).pipe(
              tap((response: ApiResponse<Consultation>) => {
                patchState(store, { consultation: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      clearConsultation: () => {
        patchState(store, { consultation: null });
      },

      clearError: () => {
        patchState(store, { error: null });
      }
    };
  })
);
