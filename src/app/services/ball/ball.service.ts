import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom, retry } from 'rxjs';
import { Ball, Brand, Core, Coverstock } from 'src/app/models/ball.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BallService {
  #brands = signal<Brand[]>([]);
  #cores = signal<Core[]>([]);
  #coverstocks = signal<Coverstock[]>([]);
  get brands() {
    return this.#brands;
  }
  get cores() {
    return this.#cores;
  }
  get coverstocks() {
    return this.#coverstocks;
  }
  constructor(private http: HttpClient) {}

  async loadBalls(page: number): Promise<Ball[]> {
    const response = await firstValueFrom(
      this.http.get<Ball[]>(`${environment.bowwwlEndpoint}balls-pages`, {
        params: {
          page: page.toString(),
        },
      }),
    );
    return response;
  }

  async loadAllBalls(updated?: string, weight?: number): Promise<Ball[]> {
    let params = new HttpParams();
    if (updated) {
      params = params.set('updated', updated);
    }
    if (weight !== undefined) {
      params = params.set('weight', weight.toString());
    }

    return firstValueFrom(this.http.get<Ball[]>(`${environment.bowwwlEndpoint}all-balls`, { params }).pipe(retry({ count: 5, delay: 2000 })));
  }

  async getBallsByCore(ball: Ball): Promise<Ball[]> {
    const response = await firstValueFrom(
      this.http.get<Ball[]>(`${environment.bowwwlEndpoint}core-balls`, {
        params: {
          core: ball.core_name,
          ballId: ball.ball_id.toString(),
        },
      }),
    );
    return response;
  }

  async getBallsByCoverstock(ball: Ball): Promise<Ball[]> {
    const response = await firstValueFrom(
      this.http.get<Ball[]>(`${environment.bowwwlEndpoint}coverstock-balls`, {
        params: {
          coverstock: ball.coverstock_name,
          ballId: ball.ball_id.toString(),
        },
      }),
    );
    return response;
  }

  async getBallByBrand(brand: string): Promise<Ball[]> {
    const response = await firstValueFrom(
      this.http.get<Ball[]>(`${environment.bowwwlEndpoint}brand`, {
        params: {
          brand,
        },
      }),
    );
    return response;
  }

  async getBrands(): Promise<Brand[]> {
    const response = await firstValueFrom(this.http.get<Brand[]>(`${environment.bowwwlEndpoint}brands`));
    this.brands.set(response);
    return response;
  }

  async getCores(): Promise<Core[]> {
    const response = await firstValueFrom(this.http.get<Core[]>(`${environment.bowwwlEndpoint}cores`));
    this.cores.set(response);
    return response;
  }

  async getCoverstocks(): Promise<Coverstock[]> {
    const response = await firstValueFrom(this.http.get<Coverstock[]>(`${environment.bowwwlEndpoint}coverstocks`));
    this.coverstocks.set(response);
    return response;
  }
}
