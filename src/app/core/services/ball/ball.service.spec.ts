import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BallService } from './ball.service';
import { Ball, Brand, Core, Coverstock } from 'src/app/core/models/ball.model';
import { environment } from 'src/environments/environment';

describe('BallService', () => {
  let service: BallService;
  let httpMock: HttpTestingController;

  const mockBalls: Ball[] = [
    {
      ball_id: '1',
      ball_name: 'Storm Phaze II',
      brand_name: 'Storm',
      brand_id: '1',
      core_weight: '15',
      core_name: 'R2S Solid',
      core_rg: '2.52',
      core_diff: '0.049',
      core_id: '1',
      core_image: '',
      core_int_diff: '0.049',
      core_type: 'symmetric',
      coverstock_name: 'Solid Reactive',
      coverstock_type: 'Solid',
      coverstock_id: '1',
      ball_image: 'test-url.jpg',
      thumbnail_image: 'test-thumb.jpg',
      availability: 'available',
      factory_finish: '3000',
      last_update: '2023-01-01',
      release_date: '2023-01-01',
      us_int: 'US'
    }
  ];

  const mockBrands: Brand[] = [
    { id: '1', brand_name: 'Storm', logo: 'storm-logo.jpg' },
    { id: '2', brand_name: 'Brunswick', logo: 'brunswick-logo.jpg' }
  ];

  const mockCores: Core[] = [
    { id: '1', core_name: 'R2S Core', brand: 'Storm', api_filter_url: 'test-url' },
    { id: '2', core_name: 'DV8 Core', brand: 'Brunswick', api_filter_url: 'test-url2' }
  ];

  const mockCoverstocks: Coverstock[] = [
    { id: '1', coverstock_name: 'Solid Reactive', brand: 'Storm', api_filter_url: 'test-url' },
    { id: '2', coverstock_name: 'Pearl Reactive', brand: 'Brunswick', api_filter_url: 'test-url2' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BallService]
    });
    
    service = TestBed.inject(BallService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadBalls', () => {
    it('should load balls for a specific page', async () => {
      const page = 1;
      
      const ballsPromise = service.loadBalls(page);
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}balls-pages?page=${page}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockBalls);
      
      const result = await ballsPromise;
      expect(result).toEqual(mockBalls);
    });

    it('should handle error when loading balls', async () => {
      const page = 1;
      
      const ballsPromise = service.loadBalls(page);
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}balls-pages?page=${page}`);
      req.error(new ProgressEvent('Network error'));
      
      try {
        await ballsPromise;
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('loadAllBalls', () => {
    it('should load all balls without parameters', async () => {
      const ballsPromise = service.loadAllBalls();
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}balls`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockBalls);
      
      const result = await ballsPromise;
      expect(result).toEqual(mockBalls);
    });

    it('should load all balls with updated date parameter', async () => {
      const updated = '2023-01-01';
      
      const ballsPromise = service.loadAllBalls(updated);
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}balls?updated=${updated}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockBalls);
      
      const result = await ballsPromise;
      expect(result).toEqual(mockBalls);
    });

    it('should load all balls with weight parameter', async () => {
      const weight = 15;
      
      const ballsPromise = service.loadAllBalls(undefined, weight);
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}balls?weight=${weight}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockBalls);
      
      const result = await ballsPromise;
      expect(result).toEqual(mockBalls);
    });

    it('should load all balls with both updated and weight parameters', async () => {
      const updated = '2023-01-01';
      const weight = 15;
      
      const ballsPromise = service.loadAllBalls(updated, weight);
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}balls?updated=${updated}&weight=${weight}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockBalls);
      
      const result = await ballsPromise;
      expect(result).toEqual(mockBalls);
    });
  });

  describe('getBallsByCore', () => {
    it('should get balls by core', async () => {
      const ball = mockBalls[0];
      
      const ballsPromise = service.getBallsByCore(ball);
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}balls-by-core/${ball.core_name}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockBalls);
      
      const result = await ballsPromise;
      expect(result).toEqual(mockBalls);
    });
  });

  describe('getBallsByCoverstock', () => {
    it('should get balls by coverstock', async () => {
      const ball = mockBalls[0];
      
      const ballsPromise = service.getBallsByCoverstock(ball);
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}balls-by-coverstock/${ball.coverstock_name}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockBalls);
      
      const result = await ballsPromise;
      expect(result).toEqual(mockBalls);
    });
  });

  describe('getBallByBrand', () => {
    it('should get balls by brand', async () => {
      const brand = 'Storm';
      
      const ballsPromise = service.getBallByBrand(brand);
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}balls-by-brand/${brand}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockBalls);
      
      const result = await ballsPromise;
      expect(result).toEqual(mockBalls);
    });
  });

  describe('getBrands', () => {
    it('should get and sort brands', async () => {
      const unsortedBrands = [
        { id: '2', brand_name: 'Brunswick', logo: 'brunswick-logo.jpg' },
        { id: '1', brand_name: 'Storm', logo: 'storm-logo.jpg' }
      ];
      
      const brandsPromise = service.getBrands();
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}brands`);
      expect(req.request.method).toBe('GET');
      
      req.flush(unsortedBrands);
      
      const result = await brandsPromise;
      expect(result[0].brand_name).toBe('Brunswick'); // Should be sorted
      expect(result[1].brand_name).toBe('Storm');
      expect(service.brands()).toEqual(result);
    });

    it('should handle error when getting brands', async () => {
      const brandsPromise = service.getBrands();
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}brands`);
      req.error(new ProgressEvent('Network error'));
      
      try {
        await brandsPromise;
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getCores', () => {
    it('should get and sort cores', async () => {
      const unsortedCores = [
        { id: '2', core_name: 'DV8 Core', brand: 'Brunswick', api_filter_url: 'test2' },
        { id: '1', core_name: 'R2S Core', brand: 'Storm', api_filter_url: 'test1' }
      ];
      
      const coresPromise = service.getCores();
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}cores`);
      expect(req.request.method).toBe('GET');
      
      req.flush(unsortedCores);
      
      const result = await coresPromise;
      expect(result[0].brand).toBe('Brunswick'); // Should be sorted by brand
      expect(result[1].brand).toBe('Storm');
      expect(service.cores()).toEqual(result);
    });

    it('should handle error when getting cores', async () => {
      const coresPromise = service.getCores();
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}cores`);
      req.error(new ProgressEvent('Network error'));
      
      try {
        await coresPromise;
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getCoverstocks', () => {
    it('should get and sort coverstocks', async () => {
      const unsortedCoverstocks = [
        { id: '2', coverstock_name: 'Pearl Reactive', brand: 'Brunswick', api_filter_url: 'test2' },
        { id: '1', coverstock_name: 'Solid Reactive', brand: 'Storm', api_filter_url: 'test1' }
      ];
      
      const coverstocksPromise = service.getCoverstocks();
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}coverstocks`);
      expect(req.request.method).toBe('GET');
      
      req.flush(unsortedCoverstocks);
      
      const result = await coverstocksPromise;
      expect(result[0].brand).toBe('Brunswick'); // Should be sorted by brand
      expect(result[1].brand).toBe('Storm');
      expect(service.coverstocks()).toEqual(result);
    });

    it('should handle error when getting coverstocks', async () => {
      const coverstocksPromise = service.getCoverstocks();
      
      const req = httpMock.expectOne(`${environment.bowwwlEndpoint}coverstocks`);
      req.error(new ProgressEvent('Network error'));
      
      try {
        await coverstocksPromise;
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('signal getters', () => {
    it('should provide brands signal', () => {
      expect(service.brands).toBeDefined();
      expect(typeof service.brands).toBe('function');
    });

    it('should provide cores signal', () => {
      expect(service.cores).toBeDefined();
      expect(typeof service.cores).toBe('function');
    });

    it('should provide coverstocks signal', () => {
      expect(service.coverstocks).toBeDefined();
      expect(typeof service.coverstocks).toBe('function');
    });
  });
});
