import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, firstValueFrom, retryWhen, scan } from 'rxjs';
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
    return firstValueFrom(
      this.http.get<Ball[]>(`${environment.bowwwlEndpoint}all-balls`).pipe(
        retryWhen((errors) =>
          errors.pipe(
            scan((retryCount, error) => {
              if (retryCount >= 5) {
                throw error;
              }
              return retryCount + 1;
            }, 0),
            delay(1000),
          ),
        ),
      ),
    );
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
