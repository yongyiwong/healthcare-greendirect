import { Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserIdentification } from '../entities/user-identification.entity';
import { IsNull, Repository } from 'typeorm';
import { UserIdentificationType } from '../user/freeway-user/freeway-user.dto';

@Injectable()
export class UserIdentificationService {
  constructor(
    @InjectRepository(UserIdentification)
    protected readonly userIdentificationRepository: Repository<UserIdentification>,
  ) {
  }

  public async createIdentification(
    userIdentification: UserIdentification,
  ): Promise<UserIdentification> {
    return await this.userIdentificationRepository.save(userIdentification);
  }

  public async updateIdentification(
    userIdentification: UserIdentification,
  ): Promise<UserIdentification> {
    return await this.userIdentificationRepository.save(userIdentification);
  }

  async findById(id: number ): Promise<UserIdentification> {
    return this.userIdentificationRepository.findOne(id);
  }

  public async deleteIdentification( id: number ){
    const userIdentification = await this.findById( id );
    if ( userIdentification ){
      await this.userIdentificationRepository.delete(id);
    }
  }

  public async findActivePatientLicenseByLocation(
    userId: number,
    locationId: number,
  ): Promise<UserIdentification> {
    const type = UserIdentificationType.MED;
    const isActive = true;

    return this.userIdentificationRepository
      .createQueryBuilder('user_identification')
      .where('user_id = :userId AND location_id = :locationId AND type =:type AND is_active =:isActive AND deleted IS NULL', {
        userId,
        locationId,
        type,
        isActive,
      })
      .getOne();
  }

  public async findActivePatientLicenseByOrganization(
    userId: number,
    organizationId: number
  ): Promise<UserIdentification[]>{

    return this.userIdentificationRepository
      .createQueryBuilder('user_identification')
      .leftJoinAndSelect('user_identification.location', 'location')
      .where('user_identification.user_id = :userId', {userId})
      .andWhere('user_identification.is_active = :isActive', {isActive: true})
      .andWhere('user_identification.deleted IS NULL')
      .andWhere('location.organization_id = :organizationId', {organizationId})
      .getMany();
  }
}
