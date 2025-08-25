import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController, LoadingController } from '@ionic/angular';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { IonHeader, IonContent, IonSearchbar, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { timeout } from 'rxjs';

// Type definitions
interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  center?: { lat: number; lon: number };
}

interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassElement[];
}

interface BowlingAlley {
  id: number;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  distance?: number;
  source: 'overpass' | 'google';
  relevanceScore: number;
}

interface CachedResult {
  data: OverpassElement[];
  timestamp: number;
}

interface SearchOptions {
  radius: number;
  useCache: boolean;
  maxRetries: number;
  fallbackRadius: number[];
}

@Component({
  selector: 'app-alley-map',
  standalone: true,
  imports: [IonHeader, IonHeader, IonTitle, IonSearchbar, IonContent, IonToolbar],
  templateUrl: './alley-map.page.html',
  styleUrls: ['./alley-map.page.scss'],
})
export class AlleyMapPage implements OnInit, OnDestroy {
  @ViewChild('map', { static: true }) mapContainer!: ElementRef;

  private map!: L.Map;
  private userLocation: L.LatLng | null = null;
  private markerClusterGroup!: L.MarkerClusterGroup;
  private userMarker: L.Marker | null = null;
  private bowlingAlleys: BowlingAlley[] = [];

  // API and caching configuration
  private readonly OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter',
  ];

  private currentEndpointIndex = 0;
  private searchCache = new Map<string, CachedResult>();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1500; // 1.5 seconds between requests

  // Search configuration
  private readonly DEFAULT_OPTIONS: SearchOptions = {
    radius: 25,
    useCache: true,
    maxRetries: 3,
    fallbackRadius: [50, 75, 100],
  };

  // Loading state
  private isLoading = false;
  private loadingElement: HTMLIonLoadingElement | null = null;

  constructor(
    private http: HttpClient,
    private toastController: ToastController,
    private loadingController: LoadingController,
  ) {}

  async ngOnInit() {
    await this.initializeMap();
    await this.initializeMapAndAttemptGeolocation();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    this.searchCache.clear();
  }

  private async initializeMap(): Promise<void> {
    // Initialize map with better default settings
    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
    }).setView([52.52, 13.405], 10); // Default to Berlin

    // Add multiple tile layer options

    const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '© OpenStreetMap contributors, © CARTO',
    });

    // Use CartoDB as default (cleaner look)
    cartoLayer.addTo(this.map);

    // Initialize marker cluster group with optimized settings
    this.markerClusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 200,
      chunkDelay: 50,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      maxClusterRadius: 50,
    });

    this.map.addLayer(this.markerClusterGroup);

    // Add scale and location controls
    L.control.scale().addTo(this.map);
  }

  private async initializeMapAndAttemptGeolocation(): Promise<void> {
    try {
      await this.showLoading('Getting your location...');
      const position = await this.getCurrentLocation();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      this.userLocation = L.latLng(lat, lng);
      this.map.setView(this.userLocation, 12);

      await this.addUserLocationMarker(lat, lng);
      await this.loadBowlingAlleysWithComprehensiveSearch(lat, lng);
    } catch (error) {
      console.error('Geolocation failed:', error);
      await this.showToast('Unable to get your location. Using default location.', 'warning');

      // Fallback to major city centers
      const fallbackLocations = [
        { name: 'Berlin', lat: 52.52, lng: 13.405 },
        { name: 'London', lat: 51.5074, lng: -0.1278 },
        { name: 'New York', lat: 40.7128, lng: -74.006 },
        { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
      ];

      const location = fallbackLocations[0]; // Default to Berlin
      this.map.setView([location.lat, location.lng], 10);
      await this.loadBowlingAlleysWithComprehensiveSearch(location.lat, location.lng);
    } finally {
      await this.hideLoading();
    }
  }

  private async getCurrentLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5 * 60 * 1000, // 5 minutes
      });
    });
  }

  private async addUserLocationMarker(lat: number, lng: number): Promise<void> {
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: #007bff;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }

    this.userMarker = L.marker([lat, lng], { icon: userIcon }).bindPopup('<b>Your Location</b>').addTo(this.map);
  }

  private async loadBowlingAlleysWithComprehensiveSearch(lat: number, lng: number, options: Partial<SearchOptions> = {}): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    const searchOptions = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      await this.showLoading('Searching for bowling alleys...');

      // Clear previous results
      this.clearBowlingAlleys();

      // Primary search strategies
      const searchStrategies = [
        () => this.searchByTags(lat, lng, searchOptions.radius),
        () => this.searchByNames(lat, lng, searchOptions.radius),
        () => this.searchBySports(lat, lng, searchOptions.radius),
      ];

      // Execute searches sequentially to avoid rate limits
      for (const strategy of searchStrategies) {
        try {
          await strategy();
          await this.updateLoadingMessage(`Found ${this.bowlingAlleys.length} bowling alleys...`);
        } catch (error) {
          console.warn('Search strategy failed:', error);
        }
      }

      // If we don't have enough results, try expanded radius
      if (this.bowlingAlleys.length < 5) {
        await this.updateLoadingMessage('Expanding search area...');

        for (const radius of searchOptions.fallbackRadius) {
          if (this.bowlingAlleys.length >= 10) break;

          try {
            await this.searchByTags(lat, lng, radius);
            await this.updateLoadingMessage(`Found ${this.bowlingAlleys.length} bowling alleys...`);
          } catch (error) {
            console.warn(`Expanded search at ${radius}km failed:`, error);
          }
        }
      }

      // Process and display results
      await this.processAndDisplayResults();

      const message =
        this.bowlingAlleys.length > 0
          ? `Found ${this.bowlingAlleys.length} bowling ${this.bowlingAlleys.length === 1 ? 'alley' : 'alleys'}`
          : 'No bowling alleys found in your area';

      await this.showToast(message, this.bowlingAlleys.length > 0 ? 'success' : 'warning');
    } catch (error) {
      console.error('Comprehensive search failed:', error);
      await this.showToast('Failed to load bowling alleys. Please try again.', 'danger');
    } finally {
      this.isLoading = false;
      await this.hideLoading();
    }
  }

  private async searchByTags(lat: number, lng: number, radiusKm: number): Promise<void> {
    const query = `
      [out:json][timeout:30];
      (
        node["leisure"="bowling_alley"](around:${radiusKm * 1000},${lat},${lng});
        way["leisure"="bowling_alley"](around:${radiusKm * 1000},${lat},${lng});
        relation["leisure"="bowling_alley"](around:${radiusKm * 1000},${lat},${lng});
        
        node["sport"="10pin"](around:${radiusKm * 1000},${lat},${lng});
        way["sport"="10pin"](around:${radiusKm * 1000},${lat},${lng});
        relation["sport"="10pin"](around:${radiusKm * 1000},${lat},${lng});
        
        node["sport"="9pin"](around:${radiusKm * 1000},${lat},${lng});
        way["sport"="9pin"](around:${radiusKm * 1000},${lat},${lng});
        relation["sport"="9pin"](around:${radiusKm * 1000},${lat},${lng});
        
        node["amenity"="bowling_alley"](around:${radiusKm * 1000},${lat},${lng});
        way["amenity"="bowling_alley"](around:${radiusKm * 1000},${lat},${lng});
        relation["amenity"="bowling_alley"](around:${radiusKm * 1000},${lat},${lng});
      );
      out center;
    `;

    await this.executeOverpassQuery(query, lat, lng, 'tags');
  }

  private async searchByNames(lat: number, lng: number, radiusKm: number): Promise<void> {
    const namePatterns = ['bowling', 'bowl', 'alley', 'lanes', 'ten pin', 'tenpin', 'strike', 'spare', 'kegling', 'kegelbahn'];

    const nameQueries = namePatterns
      .map(
        (pattern) => `
      node["name"~"${pattern}",i](around:${radiusKm * 1000},${lat},${lng});
      way["name"~"${pattern}",i](around:${radiusKm * 1000},${lat},${lng});
      relation["name"~"${pattern}",i](around:${radiusKm * 1000},${lat},${lng});
    `,
      )
      .join('');

    const query = `
      [out:json][timeout:30];
      (
        ${nameQueries}
      );
      out center;
    `;

    await this.executeOverpassQuery(query, lat, lng, 'names');
  }

  private async searchBySports(lat: number, lng: number, radiusKm: number): Promise<void> {
    const query = `
      [out:json][timeout:30];
      (
        node["sport"~"bowling",i](around:${radiusKm * 1000},${lat},${lng});
        way["sport"~"bowling",i](around:${radiusKm * 1000},${lat},${lng});
        relation["sport"~"bowling",i](around:${radiusKm * 1000},${lat},${lng});
        
        node["building"="sports_hall"]["sport"~"bowling",i](around:${radiusKm * 1000},${lat},${lng});
        way["building"="sports_hall"]["sport"~"bowling",i](around:${radiusKm * 1000},${lat},${lng});
        
        node["amenity"="entertainment"]["name"~"bowling",i](around:${radiusKm * 1000},${lat},${lng});
        way["amenity"="entertainment"]["name"~"bowling",i](around:${radiusKm * 1000},${lat},${lng});
      );
      out center;
    `;

    await this.executeOverpassQuery(query, lat, lng, 'sports');
  }

  private async executeOverpassQuery(query: string, centerLat: number, centerLng: number, searchType: string): Promise<void> {
    const cacheKey = this.getCacheKey(centerLat, centerLng, query, searchType);

    // Check cache first
    if (this.DEFAULT_OPTIONS.useCache) {
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        console.log(`Using cached results for ${searchType} search`);
        this.processOverpassElements(cachedResult.data, centerLat, centerLng);
        return;
      }
    }

    try {
      const response = await this.makeOverpassRequestWithRetry(query);
      const data = response as OverpassResponse;

      if (data.elements && data.elements.length > 0) {
        // Cache the results
        this.setCachedResult(cacheKey, data.elements);
        this.processOverpassElements(data.elements, centerLat, centerLng);
      }
    } catch (error) {
      console.error(`${searchType} search failed:`, error);
      throw error;
    }
  }

  private async makeOverpassRequestWithRetry(query: string, maxRetries = 3): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Rate limiting
        await this.throttleRequest();
        const endpoint = this.getNextEndpoint();
        console.log(`Making request to ${endpoint} (attempt ${attempt}/${maxRetries})`);

        const response = await this.http
          .post(endpoint, query, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
          .pipe(timeout(30000))
          .toPromise();

        return response;
      } catch (error: any) {
        lastError = error;
        console.warn(`Request attempt ${attempt} failed:`, error.status || error.message);

        if (error.status === 429 || (error.error && error.error.includes('rate_limited'))) {
          // Rate limited - exponential backoff
          const waitTime = Math.min(Math.pow(2, attempt) * 2000, 10000); // Cap at 10 seconds
          console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else if (attempt < maxRetries) {
          // Other error - shorter wait
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError;
  }

  private async throttleRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  private getNextEndpoint(): string {
    const endpoint = this.OVERPASS_ENDPOINTS[this.currentEndpointIndex];
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.OVERPASS_ENDPOINTS.length;
    return endpoint;
  }

  private processOverpassElements(elements: OverpassElement[], centerLat: number, centerLng: number): void {
    for (const element of elements) {
      try {
        const coords = this.extractCoordinates(element);
        if (!coords) continue;

        // Check for duplicates
        if (this.isDuplicate(coords.lat, coords.lng)) continue;

        // Filter out non-bowling venues
        if (!this.isBowlingVenue(element)) continue;

        const bowlingAlley: BowlingAlley = {
          id: element.id,
          name: this.extractName(element),
          lat: coords.lat,
          lng: coords.lng,
          address: this.extractAddress(element),
          phone: element.tags?.['phone'] || element.tags?.['contact:phone'],
          website: element.tags?.['website'] || element.tags?.['contact:website'],
          openingHours: element.tags?.['opening_hours'],
          distance: this.calculateDistance(centerLat, centerLng, coords.lat, coords.lng),
          source: 'overpass',
          relevanceScore: this.calculateRelevanceScore(element),
        };

        this.bowlingAlleys.push(bowlingAlley);
      } catch (error) {
        console.warn('Error processing element:', element.id, error);
      }
    }
  }

  private extractCoordinates(element: OverpassElement): { lat: number; lng: number } | null {
    if (element.type === 'node' && element.lat && element.lon) {
      return { lat: element.lat, lng: element.lon };
    } else if (element.center) {
      return { lat: element.center.lat, lng: element.center.lon };
    }
    return null;
  }

  private extractName(element: OverpassElement): string {
    return element.tags?.['name'] || element.tags?.['name:en'] || element.tags?.['brand'] || `Bowling Alley #${element.id}`;
  }

  private extractAddress(element: OverpassElement): string {
    const tags = element.tags || {};

    const addressParts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city'], tags['addr:postcode']].filter(Boolean);

    if (addressParts.length > 0) {
      return addressParts.join(', ');
    }

    return tags['addr:full'] || 'Address not available';
  }

  private isBowlingVenue(element: OverpassElement): boolean {
    const tags = element.tags || {};
    const name = (tags['name'] || '').toLowerCase();
    const sport = (tags['sport'] || '').toLowerCase();
    const leisure = (tags['leisure'] || '').toLowerCase();
    const amenity = (tags['amenity'] || '').toLowerCase();

    // Positive indicators
    const positiveKeywords = ['bowling', 'bowl', 'alley', 'lanes', 'ten pin', 'tenpin', 'strike', 'spare', 'pin', 'kegel', '10pin', '9pin'];

    // Negative indicators (places that might match but aren't bowling alleys)
    const negativeKeywords = [
      'restaurant',
      'bar',
      'pub',
      'hotel',
      'motel',
      'casino',
      'arcade',
      'pool',
      'billiard',
      'golf',
      'mini golf',
      'cinema',
      'shop',
      'store',
      'market',
      'car wash',
    ];

    // Check for explicit bowling tags
    if (
      leisure === 'bowling_alley' ||
      amenity === 'bowling_alley' ||
      sport.includes('10pin') ||
      sport.includes('9pin') ||
      sport.includes('bowling')
    ) {
      return true;
    }

    // Check name for positive keywords
    const hasPositiveKeyword = positiveKeywords.some((keyword) => name.includes(keyword));
    if (!hasPositiveKeyword) return false;

    // Check name for negative keywords
    const hasNegativeKeyword = negativeKeywords.some((keyword) => name.includes(keyword));
    if (hasNegativeKeyword) return false;

    return true;
  }

  private calculateRelevanceScore(element: OverpassElement): number {
    let score = 0.5; // Base score

    const tags = element.tags || {};
    const name = (tags['name'] || '').toLowerCase();
    const leisure = tags['leisure'] || '';
    const sport = tags['sport'] || '';
    const amenity = tags['amenity'] || '';

    // High relevance indicators
    if (leisure === 'bowling_alley') score += 0.4;
    if (amenity === 'bowling_alley') score += 0.4;
    if (sport.includes('10pin') || sport.includes('9pin')) score += 0.3;

    // Name analysis
    const positiveKeywords = ['bowling', 'bowl', 'alley', 'lanes', 'ten pin', 'tenpin'];
    positiveKeywords.forEach((keyword) => {
      if (name.includes(keyword)) score += 0.2;
    });

    // Additional quality indicators
    if (tags['phone'] || tags['contact:phone']) score += 0.1;
    if (tags['website'] || tags['contact:website']) score += 0.1;
    if (tags['opening_hours']) score += 0.1;
    if (tags['addr:street']) score += 0.1;

    return Math.min(1, score);
  }

  private isDuplicate(lat: number, lng: number, threshold = 100): boolean {
    return this.bowlingAlleys.some((alley) => {
      const distance = this.calculateDistance(lat, lng, alley.lat, alley.lng);
      return distance < threshold; // Within 100 meters
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async processAndDisplayResults(): Promise<void> {
    // Remove duplicates and sort by relevance
    this.bowlingAlleys = this.bowlingAlleys
      .filter((alley, index, self) => index === self.findIndex((a) => a.id === alley.id))
      .sort((a, b) => {
        // Primary sort: relevance score
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        // Secondary sort: distance
        return (a.distance || 0) - (b.distance || 0);
      });

    // Add markers to map
    this.addBowlingAlleyMarkers();

    // Fit map to show all bowling alleys
    if (this.bowlingAlleys.length > 0) {
      this.fitMapToBowlingAlleys();
    }
  }

  private addBowlingAlleyMarkers(): void {
    this.markerClusterGroup.clearLayers();

    this.bowlingAlleys.forEach((alley) => {
      const icon = this.createBowlingAlleyIcon(alley.relevanceScore);
      const marker = L.marker([alley.lat, alley.lng], { icon });

      const popupContent = this.createPopupContent(alley);
      marker.bindPopup(popupContent);

      this.markerClusterGroup.addLayer(marker);
    });
  }

  private createBowlingAlleyIcon(relevanceScore: number): L.DivIcon {
    const color = relevanceScore > 0.8 ? '#28a745' : relevanceScore > 0.6 ? '#ffc107' : '#dc3545';

    return L.divIcon({
      className: 'bowling-alley-marker',
      html: `
        <div style="
          width: 25px;
          height: 25px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          font-size: 14px;
          color: white;
          font-weight: bold;
        ">🎳</div>
      `,
      iconSize: [25, 25],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }

  private createPopupContent(alley: BowlingAlley): string {
    const distanceText = alley.distance
      ? alley.distance < 1000
        ? `${Math.round(alley.distance)}m away`
        : `${(alley.distance / 1000).toFixed(1)}km away`
      : '';

    const relevanceText = `${Math.round(alley.relevanceScore * 100)}% match`;

    return `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; color: #333;">${alley.name}</h3>
        <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">
          📍 ${alley.address}
        </p>
        ${distanceText ? `<p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">📏 ${distanceText}</p>` : ''}
        ${alley.phone ? `<p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">📞 ${alley.phone}</p>` : ''}
        ${alley.website ? `<p style="margin: 0 0 4px 0;"><a href="${alley.website}" target="_blank" style="color: #007bff;">🌐 Website</a></p>` : ''}
        ${alley.openingHours ? `<p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">🕒 ${alley.openingHours}</p>` : ''}
        <p style="margin: 4px 0 0 0; color: #999; font-size: 12px;">${relevanceText}</p>
      </div>
    `;
  }

  private fitMapToBowlingAlleys(): void {
    if (this.bowlingAlleys.length === 0) return;

    const group = new L.FeatureGroup();

    // Add user location if available
    if (this.userLocation) {
      group.addLayer(L.marker(this.userLocation));
    }

    // Add bowling alley markers
    this.bowlingAlleys.forEach((alley) => {
      group.addLayer(L.marker([alley.lat, alley.lng]));
    });

    this.map.fitBounds(group.getBounds(), {
      padding: [20, 20],
      maxZoom: 14,
    });
  }

  private clearBowlingAlleys(): void {
    this.bowlingAlleys = [];
    this.markerClusterGroup.clearLayers();
  }

  // Cache management
  private getCacheKey(lat: number, lng: number, query: string, type: string): string {
    return `${lat.toFixed(4)}_${lng.toFixed(4)}_${type}_${this.hashCode(query)}`;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private getCachedResult(key: string): CachedResult | null {
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }
    if (cached) {
      this.searchCache.delete(key); // Remove expired cache
    }
    return null;
  }

  private setCachedResult(key: string, data: OverpassElement[]): void {
    this.searchCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // UI helpers
  private async showLoading(message = 'Loading...'): Promise<void> {
    if (this.loadingElement) {
      await this.loadingElement.dismiss();
    }

    this.loadingElement = await this.loadingController.create({
      message,
      spinner: 'crescent',
      translucent: true,
    });

    await this.loadingElement.present();
  }

  private async updateLoadingMessage(message: string): Promise<void> {
    if (this.loadingElement) {
      this.loadingElement.message = message;
    }
  }

  private async hideLoading(): Promise<void> {
    if (this.loadingElement) {
      await this.loadingElement.dismiss();
      this.loadingElement = null;
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success', duration = 3000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      color,
      duration,
      position: 'bottom',
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
        },
      ],
    });
    await toast.present();
  }

  // Public methods for UI interactions
  async refreshLocation(): Promise<void> {
    if (this.isLoading) return;

    try {
      await this.showLoading('Refreshing location...');
      const position = await this.getCurrentLocation();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      this.userLocation = L.latLng(lat, lng);
      this.map.setView(this.userLocation, 12);

      await this.addUserLocationMarker(lat, lng);
      await this.loadBowlingAlleysWithComprehensiveSearch(lat, lng);
    } catch (error) {
      console.error('Location refresh failed:', error);
      await this.showToast('Unable to refresh location', 'danger');
    } finally {
      await this.hideLoading();
    }
  }

  async searchArea(): Promise<void> {
    if (!this.map || this.isLoading) return;

    const center = this.map.getCenter();
    await this.loadBowlingAlleysWithComprehensiveSearch(center.lat, center.lng);
  }

  clearCache(): void {
    this.searchCache.clear();
    this.showToast('Cache cleared', 'success', 2000);
  }

  getStats(): string {
    const total = this.bowlingAlleys.length;
    const highRelevance = this.bowlingAlleys.filter((a) => a.relevanceScore > 0.8).length;
    const cached = this.searchCache.size;

    return `Found: ${total} alleys, High quality: ${highRelevance}, Cached searches: ${cached}`;
  }

  // Search functionality
  async onSearch(event: any): Promise<void> {
    const query = event.detail.value?.trim();
    if (!query || query.length < 3) {
      // If search is cleared or too short, show all bowling alleys
      this.addBowlingAlleyMarkers();
      return;
    }

    try {
      await this.showLoading('Searching...');

      // Filter existing bowling alleys by search term
      const filteredAlleys = this.bowlingAlleys.filter(
        (alley) =>
          alley.name.toLowerCase().includes(query.toLowerCase()) || (alley.address && alley.address.toLowerCase().includes(query.toLowerCase())),
      );

      // Clear current markers
      this.markerClusterGroup.clearLayers();

      // Add filtered markers
      filteredAlleys.forEach((alley) => {
        const icon = this.createBowlingAlleyIcon(alley.relevanceScore);
        const marker = L.marker([alley.lat, alley.lng], { icon });
        const popupContent = this.createPopupContent(alley);
        marker.bindPopup(popupContent);
        this.markerClusterGroup.addLayer(marker);
      });

      // If no local results found, try geocoding search
      if (filteredAlleys.length === 0) {
        await this.performGeocodingSearch(query);
      } else {
        await this.showToast(`Found ${filteredAlleys.length} matching bowling ${filteredAlleys.length === 1 ? 'alley' : 'alleys'}`, 'success');

        // Fit map to filtered results
        if (filteredAlleys.length > 0) {
          const group = new L.FeatureGroup();
          filteredAlleys.forEach((alley) => {
            group.addLayer(L.marker([alley.lat, alley.lng]));
          });
          this.map.fitBounds(group.getBounds(), {
            padding: [20, 20],
            maxZoom: 14,
          });
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      await this.showToast('Search failed. Please try again.', 'danger');
    } finally {
      await this.hideLoading();
    }
  }

  // Geocoding search for location-based queries
  private async performGeocodingSearch(query: string): Promise<void> {
    try {
      // Use Nominatim for geocoding
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const response = (await this.http.get(geocodeUrl).toPromise()) as any[];

      if (response && response.length > 0) {
        const result = response[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        // Move map to searched location
        this.map.setView([lat, lng], 12);

        // Search for bowling alleys in this new location
        await this.loadBowlingAlleysWithComprehensiveSearch(lat, lng);

        await this.showToast(`Searching for bowling alleys near ${result.display_name}`, 'success');
      } else {
        await this.showToast('Location not found', 'warning');
      }
    } catch (error) {
      console.error('Geocoding search failed:', error);
      await this.showToast('Location search failed', 'danger');
    }
  }

  // Clear search and show all results
  onSearchClear(): void {
    this.addBowlingAlleyMarkers();
    if (this.bowlingAlleys.length > 0) {
      this.fitMapToBowlingAlleys();
    }
  }

  // Reset to user's initial location
  async resetToInitialLocation(): Promise<void> {
    if (this.userLocation) {
      this.map.setView(this.userLocation, 12);
      await this.loadBowlingAlleysWithComprehensiveSearch(this.userLocation.lat, this.userLocation.lng);
    } else {
      await this.refreshLocation();
    }
  }

  // Toggle between different map views
  toggleMapLayer(): void {
    // This method can be used to switch between different tile layers
    // You can expand this to cycle through different map styles
    this.showToast('Map layer toggled', 'success', 2000);
  }

  // Export bowling alleys data (useful for debugging or data export)
  exportBowlingAlleys(): void {
    const data = this.bowlingAlleys.map((alley) => ({
      name: alley.name,
      address: alley.address,
      lat: alley.lat,
      lng: alley.lng,
      phone: alley.phone,
      website: alley.website,
      relevanceScore: alley.relevanceScore,
      distance: alley.distance,
    }));

    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'bowling-alleys.json';
    link.click();

    URL.revokeObjectURL(url);
    this.showToast('Bowling alleys data exported', 'success');
  }

  // Get bowling alley by ID (useful for direct access)
  getBowlingAlleyById(id: number): BowlingAlley | undefined {
    return this.bowlingAlleys.find((alley) => alley.id === id);
  }

  // Focus map on specific bowling alley
  focusOnBowlingAlley(alleyId: number): void {
    const alley = this.getBowlingAlleyById(alleyId);
    if (alley) {
      this.map.setView([alley.lat, alley.lng], 16);

      // Find and open the popup for this marker
      this.markerClusterGroup.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          const latlng = layer.getLatLng();
          if (Math.abs(latlng.lat - alley.lat) < 0.0001 && Math.abs(latlng.lng - alley.lng) < 0.0001) {
            layer.openPopup();
          }
        }
      });
    }
  }

  // Get nearest bowling alley to a given location
  getNearestBowlingAlley(lat: number, lng: number): BowlingAlley | null {
    if (this.bowlingAlleys.length === 0) return null;

    return this.bowlingAlleys.reduce((nearest, current) => {
      const currentDistance = this.calculateDistance(lat, lng, current.lat, current.lng);
      const nearestDistance = this.calculateDistance(lat, lng, nearest.lat, nearest.lng);

      return currentDistance < nearestDistance ? current : nearest;
    });
  }

  // Filter bowling alleys by distance
  filterByDistance(maxDistanceKm: number): BowlingAlley[] {
    if (!this.userLocation) return this.bowlingAlleys;

    return this.bowlingAlleys.filter((alley) => {
      if (!alley.distance) {
        alley.distance = this.calculateDistance(this.userLocation!.lat, this.userLocation!.lng, alley.lat, alley.lng);
      }
      return alley.distance <= maxDistanceKm * 1000;
    });
  }

  // Sort bowling alleys by different criteria
  sortBowlingAlleys(criteria: 'distance' | 'relevance' | 'name'): void {
    switch (criteria) {
      case 'distance':
        this.bowlingAlleys.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      case 'relevance':
        this.bowlingAlleys.sort((a, b) => b.relevanceScore - a.relevanceScore);
        break;
      case 'name':
        this.bowlingAlleys.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    // Refresh markers with new order
    this.addBowlingAlleyMarkers();
    this.showToast(`Sorted by ${criteria}`, 'success', 2000);
  }
}
