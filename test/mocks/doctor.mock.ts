import { TestingModule } from '@nestjs/testing';
import { DoctorService } from '../../src/doctor/doctor.service';

const DOCTOR_DATA = [
  {
    name: 'HY PRIO',
    description: 'HIGH PRIO',
    longLat: '(-67.2532900,18.3433878)',
    addressLine1: 'Camino de Uno',
    city: 'ENGLAND',
    priority: 1,
  },
  {
    name: 'Medico Uno',
    description: '#1 DOCTOR',
    longLat: '(-67.2432900,18.3434878)',
    addressLine1: 'Camino de Uno',
    city: 'ENGLAND',
    priority: 1,
  },
];

export class DoctorMock {
  private doctorService: DoctorService;

  constructor(private readonly module: TestingModule) {
    this.doctorService = module.get<DoctorService>(DoctorService);
  }

  async generate() {
    const promises = DOCTOR_DATA.map(doctor => {
      return this.doctorService.create(doctor as any);
    });
    await Promise.all(promises);
  }
}
