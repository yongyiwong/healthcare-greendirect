export interface DoctorSearchDto {
  id: number;
  name: string;
  website: string;
  email: string;
  thumbnail: string;
  longLat: { x: number; y: number }; // x = longitude; y = latitude
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateId: number;
  state: string; // abbreviation for state code
  postalCode: string;
  phoneNumber: string;
  priority: number;
  modified: Date;
}
