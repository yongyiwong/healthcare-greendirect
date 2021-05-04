import { Injectable } from '@nestjs/common';
import { createClient } from '@google/maps';
import { ConfigService } from '@sierralabs/nest-utils';

/**
 * Warning: incomplete d.ts types.
 * For reference on how to add Google Maps APIs: github.com/googlemaps/google-maps-services-js
 */
@Injectable()
export class MapsService {
  private client = null;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get('vendors.googleMaps');
    this.client = createClient({
      Promise,
      key: config.apiKey,
    });
  }

  public async getTimezone(lat, long) {
    if (!long && !lat) return null;
    return new Promise<string>((resolve, reject) => {
      return this.client
        .timezone({ location: `${lat},${long}` })
        .asPromise()
        .then(response => {
          resolve(response.json.timeZoneId || null);
        }, reject);
    });
  }
}
