import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment, CreateAppointmentRequest } from '../../../core/models/appointment.model';
import { ApiResponse, PagedResponse } from '../../../core/models/common.model';

export interface AppointmentState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  loading: boolean;
  error: string | null;
  totalElements: number;
  currentPage: number;
}

const initialState: AppointmentState = {
  appointments: [],
  selectedAppointment: null,
  loading: false,
  error: null,
  totalElements: 0,
  currentPage: 0
};

export const AppointmentStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    hasAppointments: computed(() => state.appointments().length > 0),
    pendingAppointments: computed(() => state.appointments().filter((a) => a.status === 'PENDING')),
    approvedAppointments: computed(() => state.appointments().filter((a) => a.status === 'APPROVED'))
  })),
  withMethods((store) => {
    const appointmentService = inject(AppointmentService);
    return {
      loadAppointments: rxMethod<{ page?: number; size?: number; status?: string; doctorId?: string } | void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((params) =>
            appointmentService.getAppointments(params?.page || 0, params?.size || 20, params?.status, params?.doctorId).pipe(
              tap((response: ApiResponse<PagedResponse<Appointment>>) => {
                patchState(store, {
                  appointments: response.data.content,
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

      loadAppointment: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((id) =>
            appointmentService.getAppointmentById(id).pipe(
              tap((response: ApiResponse<Appointment>) => {
                patchState(store, { selectedAppointment: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      createAppointment: rxMethod<CreateAppointmentRequest>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((appointment) =>
            appointmentService.createAppointment(appointment).pipe(
              tap((response: ApiResponse<Appointment>) => {
                patchState(store, (state) => ({
                  appointments: [response.data, ...state.appointments],
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

      approveAppointment: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((id) =>
            appointmentService.approveAppointment(id).pipe(
              tap((response: ApiResponse<Appointment>) => {
                patchState(store, (state) => ({
                  appointments: state.appointments.map((a) => (a.id === id ? response.data : a)),
                  selectedAppointment: state.selectedAppointment?.id === id ? response.data : state.selectedAppointment,
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

      cancelAppointment: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((id) =>
            appointmentService.cancelAppointment(id).pipe(
              tap((response: ApiResponse<Appointment>) => {
                patchState(store, (state) => ({
                  appointments: state.appointments.map((a) => (a.id === id ? response.data : a)),
                  selectedAppointment: state.selectedAppointment?.id === id ? response.data : state.selectedAppointment,
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

      clearSelectedAppointment: () => {
        patchState(store, { selectedAppointment: null });
      },

      clearError: () => {
        patchState(store, { error: null });
      }
    };
  })
);
