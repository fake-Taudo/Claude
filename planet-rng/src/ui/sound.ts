// UI sound hook. The audio engine registers itself here, so UI code never depends on it.

export type UiSound = 'click' | 'tab' | 'toggle' | 'open' | 'close' | 'error' | 'coins' | 'buy' | 'brew' | 'craft' | 'sell' | 'equip' | 'drink' | 'claim';

let impl: (name: UiSound) => void = () => undefined;

export function sfx(name: UiSound): void {
  try {
    impl(name);
  } catch {
    /* audio must never break the game */
  }
}

export function registerSfx(fn: (name: UiSound) => void): void {
  impl = fn;
}
