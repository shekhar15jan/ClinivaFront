import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { BillingService } from '../../../core/services/billing.service';
import { Bill, BillPreview, CreateBillRequest } from '../../../core/models/billing.model';
import { ApiResponse, PagedResponse } from '../../../core/models/common.model';

export interface BillingState {
  bills: Bill[];
  selectedBill: Bill | null;
  billPreview: BillPreview | null;
  loading: boolean;
  error: string | null;
  totalElements: number;
  currentPage: number;
}

const initialState: BillingState = {
  bills: [],
  selectedBill: null,
  billPreview: null,
  loading: false,
  error: null,
  totalElements: 0,
  currentPage: 0
};

export const BillingStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    hasBills: computed(() => state.bills().length > 0),
    unpaidBills: computed(() => state.bills().filter((b) => b.status === 'UNPAID')),
    totalOutstanding: computed(() =>
      state.bills()
        .filter((b) => b.status === 'UNPAID')
        .reduce((sum, b) => sum + b.dueAmountInPaisa, 0)
    )
  })),
  withMethods((store) => {
    const billingService = inject(BillingService);
    return {
      loadBills: rxMethod<{ page?: number; size?: number; status?: string } | void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((params) =>
            billingService.getBills(params?.page || 0, params?.size || 20, params?.status).pipe(
              tap((response: ApiResponse<PagedResponse<Bill>>) => {
                patchState(store, {
                  bills: response.data.content,
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

      loadBill: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((id) =>
            billingService.getBillById(id).pipe(
              tap((response: ApiResponse<Bill>) => {
                patchState(store, { selectedBill: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      loadBillPreview: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((appointmentId) =>
            billingService.getBillPreview(appointmentId).pipe(
              tap((response: ApiResponse<BillPreview>) => {
                patchState(store, { billPreview: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      createBill: rxMethod<CreateBillRequest>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((bill) =>
            billingService.createBill(bill.prescriptionId, bill).pipe(
              tap((response: ApiResponse<Bill>) => {
                patchState(store, (state) => ({
                  bills: [response.data, ...state.bills],
                  selectedBill: response.data,
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

      updateBillStatus: rxMethod<{ id: string; status: string; paidAmount?: number }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(({ id, status, paidAmount }) =>
            billingService.updateBillStatus(id, status, paidAmount).pipe(
              tap((response: ApiResponse<Bill>) => {
                patchState(store, (state) => ({
                  bills: state.bills.map((b) => (b.id === id ? response.data : b)),
                  selectedBill: state.selectedBill?.id === id ? response.data : state.selectedBill,
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

      clearSelectedBill: () => {
        patchState(store, { selectedBill: null, billPreview: null });
      },

      clearError: () => {
        patchState(store, { error: null });
      }
    };
  })
);
