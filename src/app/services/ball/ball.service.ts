import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Ball } from 'src/app/models/ball.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BallService {
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

  async loadAllBalls(): Promise<Ball[]> {
    const response = await firstValueFrom(this.http.get<Ball[]>(`${environment.bowwwlEndpoint}all-balls`));
    return response;
  }

  async getSameCoreBalls(ball: Ball): Promise<Ball[]> {
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

  async getSameCoverstockBalls(ball: Ball): Promise<Ball[]> {
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
}
