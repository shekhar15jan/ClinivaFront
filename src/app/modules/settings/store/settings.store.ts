import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { SettingService } from '../../../core/services/setting.service';
import { ClinicSettings } from '../../../core/models/setting.model';
import { ApiResponse } from '../../../core/models/common.model';

export interface SettingsState {
  settings: ClinicSettings | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: null,
  loading: false,
  error: null
};

export const SettingsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const settingService = inject(SettingService);
    return {
      loadSettings: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            settingService.get().pipe(
              tap((response: ApiResponse<ClinicSettings>) => {
                patchState(store, { settings: response.data, loading: false });
              }),
              catchError((error) => {
                patchState(store, { error: error.message, loading: false });
                return EMPTY;
              })
            )
          )
        )
      ),

      updateSettings: rxMethod<Partial<ClinicSettings>>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((settings) =>
            settingService.update(settings).pipe(
              tap((response: ApiResponse<ClinicSettings>) => {
                patchState(store, { settings: response.data, loading: false });
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
