import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import { DashboardStats, AppointmentTrend, RevenueReport, DoctorPerformance } from '../../../core/models/report.model';

export interface ReportState {
  dashboardStats: DashboardStats | null;
  appointmentTrends: AppointmentTrend[];
  revenueReport: RevenueReport | null;
  doctorPerformance: DoctorPerformance[];
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  dashboardStats: null,
  appointmentTrends: [],
  revenueReport: null,
  doctorPerformance: [],
  loading: false,
  error: null
};

export const ReportStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const reportService = inject(ReportService);
    return {
      loadDashboardStats: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            reportService.getDashboardStats().pipe(
              tap((response) => {
                patchState(store, { dashboardStats: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      loadAppointmentTrends: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            reportService.getAppointmentTrends().pipe(
              tap((response) => {
                patchState(store, { appointmentTrends: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      loadRevenueReport: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            reportService.getRevenueReport().pipe(
              tap((response) => {
                patchState(store, { revenueReport: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      loadDoctorPerformance: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            reportService.getDoctorPerformance().pipe(
              tap((response) => {
                patchState(store, { doctorPerformance: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      clearError: () => {
        patchState(store, { error: null });
      }
    };
  })
);
