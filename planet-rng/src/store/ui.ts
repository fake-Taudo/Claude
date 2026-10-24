// Transient UI state (never saved): open panel, dialogs, toasts, popovers.

import { GAME } from '../config';
import type { OfflineSummary } from '../core/offline';
import { Observable } from './emitter';
import type { ToastSpec } from './store';

export type PanelId = 'inventory' | 'shop' | 'forge' | 'potions' | 'effects' | 'rebirth' | 'quests' | 'settings' | 'admin';

export interface DialogSpec {
  title: string;
  body: string;
  confirm: string;
  cancel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export type ModalSpec =
  | { kind: 'sell'; aura: string }
  | { kind: 'bulkSell' }
  | { kind: 'export' }
  | { kind: 'import' };

export interface Toast extends ToastSpec {
  id: number;
  at: number;
}

export class UiStore extends Observable {
  panel: PanelId | null = null;
  tab: Record<string, string> = {};
  dialog: DialogSpec | null = null;
  modal: ModalSpec | null = null;
  toasts: Toast[] = [];
  popover: 'luck' | 'speed' | 'biome' | null = null;
  offline: OfflineSummary | null = null;
  auraDetail: string | null = null;
  cutsceneActive = false;
  private nextToast = 1;

  open(panel: PanelId, tab?: string): void {
    this.panel = panel;
    if (tab) this.tab[panel] = tab;
    this.popover = null;
    this.changed();
  }

  close(): void {
    if (this.dialog) {
      this.dialog = null;
    } else if (this.modal) {
      this.modal = null;
    } else if (this.auraDetail) {
      this.auraDetail = null;
    } else if (this.popover) {
      this.popover = null;
    } else {
      this.panel = null;
    }
    this.changed();
  }

  setTab(panel: PanelId, tab: string): void {
    this.tab[panel] = tab;
    this.changed();
  }

  openModal(spec: ModalSpec): void {
    this.modal = spec;
    this.changed();
  }

  closeModal(): void {
    this.modal = null;
    this.changed();
  }

  confirm(spec: DialogSpec): void {
    this.dialog = spec;
    this.changed();
  }

  closeDialog(): void {
    this.dialog = null;
    this.changed();
  }

  pushToast(spec: ToastSpec): void {
    const t: Toast = { ...spec, id: this.nextToast++, at: Date.now() };
    this.toasts = [...this.toasts, t].slice(-GAME.ui.maxToasts);
    this.changed();
    setTimeout(() => this.dismissToast(t.id), GAME.ui.toastMs);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.changed();
  }

  togglePopover(p: UiStore['popover']): void {
    this.popover = this.popover === p ? null : p;
    this.changed();
  }

  showAura(id: string | null): void {
    this.auraDetail = id;
    this.changed();
  }
}
