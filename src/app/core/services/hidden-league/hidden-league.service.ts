import { Injectable, signal, Signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HiddenLeagueSelectionService {
  private _selectionState = signal<Record<string, boolean>>({});
  readonly selectionState: Signal<Record<string, boolean>> = this._selectionState;
  public set selectionStateValue(value: Record<string, boolean>) {
    this._selectionState.set(value);
  }

  setAvailableLeagues(keys: string[]) {
    this._selectionState.update(() => {
      const defaults = keys.reduce(
        (acc, k) => {
          acc[k] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );

      const savedJson = localStorage.getItem('leagueSelection');
      const saved: Record<string, boolean> = savedJson ? JSON.parse(savedJson) : {};

      const initial = { ...defaults, ...saved };

      return initial;
    });
  }

  updateSelection(league: string, visible: boolean) {
    this._selectionState.update((old) => {
      const next = { ...old, [league]: visible };
      localStorage.setItem('leagueSelection', JSON.stringify(next));
      return next;
    });
  }
}
