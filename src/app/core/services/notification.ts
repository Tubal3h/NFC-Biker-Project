import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastr = inject(ToastrService);

  showSuccess(message: string, title?: string) {
    this.toastr.success(message, title || 'Successo');
  }

  showError(message: string, title?: string) {
    this.toastr.error(message, title || 'Errore');
  }

  showInfo(message: string, title?: string) {
    this.toastr.info(message, title || 'Informazione');
  }

  showWarning(message: string, title?: string) {
    this.toastr.warning(message, title || 'Attenzione');
  }
}