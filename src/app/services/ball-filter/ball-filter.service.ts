import { Injectable } from '@angular/core';
import { BallFilter } from 'src/app/models/filter.model';

@Injectable({
  providedIn: 'root'
})
export class BallFilterService {  
  defaultFilters: BallFilter = {
    brand: ['all'],
    coverStock: ['all'],
    market: 'all',
    coreType: 'all',
    weight: 15,
    availability: 'all',
    releaseDate: 'all',
    minRg: 0,
    maxRg: 3,
    minDiff: 0,
    maxDiff: 0.1,
    inArsenal: false
  }
  
  constructor() { }
}
