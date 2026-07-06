import {Injectable, signal} from '@angular/core';

export interface GeoPosition {
    latitude: number;
    longitude: number;
}

@Injectable({providedIn: 'root'})
export class LocationService {
    readonly lastKnownPosition = signal<GeoPosition | null>(null);
    readonly lastError = signal<string | null>(null);

    set(position: GeoPosition): void {
        this.lastError.set(null);
        this.lastKnownPosition.set(position);
    }

    setError(message: string): void {
        this.lastError.set(message);
    }

    googleMapsUrl(position: GeoPosition): string {
        return `https://www.google.com/maps?q=${position.latitude},${position.longitude}`;
    }

    openStreetMapUrl(position: GeoPosition): string {
        return `https://www.openstreetmap.org/?mlat=${position.latitude}&mlon=${position.longitude}#map=16/${position.latitude}/${position.longitude}`;
    }
}
