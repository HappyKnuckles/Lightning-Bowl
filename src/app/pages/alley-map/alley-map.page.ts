import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IonToolbar, IonHeader, IonContent, IonSearchbar, IonTitle } from '@ionic/angular/standalone';
import * as L from 'leaflet';

if (L.Icon?.Default?.prototype) {
  const iconPrototype = L.Icon.Default.prototype as any;
  if (typeof iconPrototype._getIconUrl === 'function') {
    delete iconPrototype._getIconUrl;
  }

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
    iconUrl: 'assets/leaflet/marker-icon.png',
    shadowUrl: 'assets/leaflet/marker-shadow.png',
  });
}

@Component({
  selector: 'app-alley-map',
  standalone: true,
  imports: [IonTitle, IonSearchbar, IonContent, IonHeader, IonToolbar],
  templateUrl: './alley-map.page.html',
  styleUrls: ['./alley-map.page.css'],
})
export class AlleyMapPage implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map!: L.Map;
  private markerClusterGroup!: L.MarkerClusterGroup;
  private userMarker!: L.CircleMarker;
  private userCoords: [number, number] = [40.7128, -74.006];
  private initialUserCoords: [number, number] | null = null;
  private readonly overpassUrl = 'https://overpass-api.de/api/interpreter';
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  async ngOnInit(): Promise<void> {
    this.initializeMapAndAttemptGeolocation();
  }

  async onSearch(event: any): Promise<void> {
    const query = event.detail.value;
    if (!query || query.trim() === '') {
      this.resetToInitialLocation();
      return;
    }
    try {
      const url = `${this.nominatimUrl}?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const results: any[] = (await this.http.get<any[]>(url).toPromise()) || [];
      if (results && results.length > 0) {
        const { lat, lon } = results[0];
        this.userCoords = [parseFloat(lat), parseFloat(lon)];
        this.map.setView(this.userCoords, 13);
        if (this.userMarker) {
          this.userMarker.setLatLng(this.userCoords).setPopupContent('Searched Location').openPopup();
        }
        await this.loadBowlingAlleys();
      } else {
        console.warn('No results found for:', query);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }

  private async resetToInitialLocation(): Promise<void> {
    if (this.initialUserCoords) {
      this.userCoords = [...this.initialUserCoords];
      this.map.setView(this.userCoords, 13);
      if (this.userMarker) {
        this.userMarker.setLatLng(this.userCoords).setPopupContent('You!').openPopup();
      }
      await this.loadBowlingAlleys();
    }
  }

  private initializeMapAndAttemptGeolocation(): void {
    if (this.map) {
      this.map.off();
      this.map.remove();
    }
    this.map = L.map(this.mapContainer.nativeElement);

    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          this.userCoords = [coords.latitude, coords.longitude];
          this.initialUserCoords = [coords.latitude, coords.longitude];
          this.map.setView(this.userCoords, 13);
          await this.addMapLayersAndMarkers();
        },
        async (error) => {
          console.warn(`Error getting current location: ${error.message} (Code: ${error.code})`);
          this.initialUserCoords = [...this.userCoords];
          this.map.setView(this.userCoords, 13);
          await this.addMapLayersAndMarkers();
        },
        options,
      );
    } else {
      console.warn('Geolocation not supported.');
      this.initialUserCoords = [...this.userCoords];
      this.map.setView(this.userCoords, 13);
      void this.addMapLayersAndMarkers();
    }
  }

  private async addMapLayersAndMarkers(): Promise<void> {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.userMarker = L.circleMarker(this.userCoords, {
      radius: 8,
      fillColor: 'red',
      color: 'red',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
    })
      .addTo(this.map)
      .bindPopup('You!')
      .openPopup();

    if (typeof L.markerClusterGroup === 'function') {
      this.markerClusterGroup = L.markerClusterGroup();
      this.map.addLayer(this.markerClusterGroup);
    }

    await this.loadBowlingAlleys();
  }

  private async loadBowlingAlleys(): Promise<void> {
    if (this.markerClusterGroup) {
      this.markerClusterGroup.clearLayers();
    }

    const [lat, lon] = this.userCoords;
    const radius = 50000;
    const query = `
[out:json];
(
  node["leisure"="bowling_alley"](around:${radius},${lat},${lon});
  way["leisure"="bowling_alley"](around:${radius},${lat},${lon});
  relation["leisure"="bowling_alley"](around:${radius},${lat},${lon});
  node["sport"="bowling"](around:${radius},${lat},${lon});
  way["sport"="bowling"](around:${radius},${lat},${lon});
  relation["sport"="bowling"](around:${radius},${lat},${lon});
);
out center;`;

    const blueIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    try {
      const response: any = await this.http
        .post(this.overpassUrl, query, {
          headers: { 'Content-Type': 'text/plain' },
        })
        .toPromise();

      if (response.elements?.length) {
        response.elements.forEach((elem: any) => {
          const coords: [number, number] = [elem.center?.lat || elem.lat, elem.center?.lon || elem.lon];
          const tags = elem.tags || {};
          const name = tags.name || 'Bowling Alley';
          const openingHours = tags.opening_hours;
          const phone = tags.phone;
          const website = tags.website;
          let popupContent = `<b>${name}</b>`;
          if (openingHours) {
            const formattedHours = openingHours.replace(/;\s*/g, '<br>');
            popupContent += `<br><b>Hours:</b><br>${formattedHours}`;
          }
          if (phone) {
            popupContent += `<br>Phone: ${phone}`;
          }
          if (website) {
            const url = website.startsWith('http') ? website : `http://${website}`;
            popupContent += `<br><a href="${url}" target="_blank" rel="noopener noreferrer">Website</a>`;
          }
          const marker = L.marker(coords, { icon: blueIcon });
          marker.bindPopup(popupContent);
          if (this.markerClusterGroup) {
            this.markerClusterGroup.addLayer(marker);
          } else {
            marker.addTo(this.map);
          }
        });
      } else {
        console.warn('No bowling alleys found nearby.');
      }
    } catch (error) {
      console.error('Error loading bowling alleys:', error);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
