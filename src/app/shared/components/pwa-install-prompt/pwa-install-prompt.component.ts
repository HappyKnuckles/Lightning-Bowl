import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonFooter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  close, 
  flash, 
  wifiOutline, 
  notifications, 
  phonePortrait, 
  download, 
  shareOutline,
  checkmark 
} from 'ionicons/icons';

@Component({
  selector: 'app-pwa-install-prompt',
  templateUrl: './pwa-install-prompt.component.html',
  styleUrls: ['./pwa-install-prompt.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonFooter,
  ],
})
export class PwaInstallPromptComponent implements OnInit {
  @Input() isOpen = false;
  @Input() canInstall = false;
  @Output() install = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  isChrome = false;
  isIOS = false;

  constructor() {
    addIcons({ 
      close, 
      flash, 
      wifiOutline, 
      notifications, 
      phonePortrait, 
      download, 
      shareOutline,
      checkmark 
    });
  }

  ngOnInit(): void {
    this.detectBrowser();
  }

  private detectBrowser(): void {
    const userAgent = navigator.userAgent;
    this.isChrome = /Chrome|Chromium|Edge/.test(userAgent) && !/Safari/.test(userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(userAgent) && 
                 !!(window as any).safari &&
                 !(window as any).MSStream &&
                 !/CriOS|FxiOS|EdgiOS/.test(userAgent); // True iOS Safari, not Chrome/Firefox/Edge on iOS
  }

  onInstall(): void {
    this.install.emit();
  }

  onDismiss(): void {
    this.dismiss.emit();
  }
}