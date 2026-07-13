import { inject, computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { MedicineService } from '../../../core/services/medicine.service';
import { Medicine } from '../../../core/models/medicine.model';
import { ApiResponse, PagedResponse } from '../../../core/models/common.model';

export interface MedicineState {
  medicines: Medicine[];
  searchResults: Medicine[];
  selectedMedicine: Medicine | null;
  loading: boolean;
  error: string | null;
  totalElements: number;
  currentPage: number;
}

const initialState: MedicineState = {
  medicines: [],
  searchResults: [],
  selectedMedicine: null,
  loading: false,
  error: null,
  totalElements: 0,
  currentPage: 0
};

export const MedicineStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    hasMedicines: computed(() => state.medicines().length > 0),
    activeMedicines: computed(() => state.medicines().filter((m) => !m.isDiscontinued))
  })),
  withMethods((store) => {
    const medicineService = inject(MedicineService);
    return {
      loadMedicines: rxMethod<{ page?: number; size?: number; search?: string } | void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((params) =>
            medicineService.getMedicines(params?.page || 0, params?.size || 20, params?.search).pipe(
              tap((response: ApiResponse<PagedResponse<Medicine>>) => {
                patchState(store, {
                  medicines: response.data.content,
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

      searchMedicines: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((query) =>
            medicineService.searchMedicines(query).pipe(
              tap((response: ApiResponse<Medicine[]>) => {
                patchState(store, { searchResults: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      loadMedicine: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((id) =>
            medicineService.getMedicineById(id).pipe(
              tap((response: ApiResponse<Medicine>) => {
                patchState(store, { selectedMedicine: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      createMedicine: rxMethod<Partial<Medicine>>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((medicine) =>
            medicineService.createMedicine(medicine as Medicine).pipe(
              tap((response: ApiResponse<Medicine>) => {
                patchState(store, (state) => ({
                  medicines: [...state.medicines, response.data],
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

      updateMedicine: rxMethod<{ id: string; medicine: Partial<Medicine> }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(({ id, medicine }) =>
            medicineService.updateMedicine(id, medicine).pipe(
              tap((response: ApiResponse<Medicine>) => {
                patchState(store, (state) => ({
                  medicines: state.medicines.map((m) => (m.id === id ? response.data : m)),
                  selectedMedicine: state.selectedMedicine?.id === id ? response.data : state.selectedMedicine,
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

      clearSearchResults: () => {
        patchState(store, { searchResults: [] });
      },

      clearSelectedMedicine: () => {
        patchState(store, { selectedMedicine: null });
      },

      clearError: () => {
        patchState(store, { error: null });
      }
    };
  })
);
