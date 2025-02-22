import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { SwUpdate } from '@angular/service-worker';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { StorageService } from './services/storage/storage.service';
import { Observable, of } from 'rxjs'; // Import `of` to create observables

const mockStorageService = {
  getItem: jasmine.createSpy('getItem').and.returnValue(Promise.resolve(null)),
  setItem: jasmine.createSpy('setItem').and.returnValue(Promise.resolve()),
};

const mockSwUpdate = {
  isEnabled: false,
  available: new Observable((subscriber: { next: (arg0: { current: string; available: string }) => void; complete: () => void }) => {
    subscriber.next({ current: '1.0.0', available: '1.1.0' });
    subscriber.complete();
  }),
  subscribe: (callback: (value: any) => void) => {
    mockSwUpdate.available.subscribe(callback);
  },
};

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [AppComponent],
    providers: [
        { provide: StorageService, useValue: mockStorageService },
        { provide: SwUpdate, useValue: mockSwUpdate },
        provideHttpClient(withInterceptorsFromDi()),
    ]
}).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
