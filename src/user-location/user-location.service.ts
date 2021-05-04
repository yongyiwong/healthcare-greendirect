import { Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Transaction,
  TransactionRepository,
  UpdateResult,
} from 'typeorm';
import { Location } from '../entities/location.entity';
import { UserLocation } from '../entities/user-location.entity';
import { User } from '../entities/user.entity';
import { RoleEnum } from '../roles/roles.enum';
import { UserService } from '../user/user.service';
import { RolesService } from '../roles/roles.service';
import { SaveUserLocationsCompatDto } from './dto/save-user-locations-compat.dto';
import { UserLocationExceptions } from './user-location.exceptions';
import { GDExpectedException } from '../gd-expected.exception';

@Injectable()
export class UserLocationService {
  constructor(
    @InjectRepository(UserLocation)
    protected readonly userLocationRepository: Repository<UserLocation>,
    protected readonly userService: UserService,
    protected readonly rolesService: RolesService,
  ) {}

  public async getOne(id: number): Promise<UserLocation> {
    return this.userLocationRepository.findOneOrFail(id, {
      relations: ['user'],
      where: { deleted: false },
    });
  }

  public async getAll(): Promise<UserLocation[]> {
    return this.userLocationRepository.find({
      where: {
        deleted: false,
      },
      relations: ['location'],
    });
  }

  public async getAllByUserId(userId: number): Promise<UserLocation[]> {
    return this.userLocationRepository
      .createQueryBuilder('userLocation')
      .innerJoinAndSelect('userLocation.user', 'user')
      .innerJoinAndSelect(
        'userLocation.location',
        'location',
        'location.deleted = false',
      )
      .leftJoinAndSelect('location.organization', 'organization')
      .where('userLocation.deleted = false AND userLocation.user = :userId', {
        userId,
      })
      .getMany();
  }

  public async getAllByUserWithCount(
    user: User | number,
  ): Promise<[UserLocation[], number]> {
    return this.userLocationRepository.findAndCount({
      user: user as User,
      deleted: false,
    });
  }

  public async getAllUsers(
    locationId?: number,
    search?: string,
    page: number = 0,
    limit: number = 100,
    order?: string,
    includeDeleted?: boolean,
  ): Promise<[User[], number]> {
    const filter = '%' + (search || '') + '%';
    const offset = page * limit;
    const query = await this.userLocationRepository
      .createQueryBuilder('user_location')
      .select('DISTINCT user.id')
      .addSelect([
        'user.firstName as "firstName"',
        'user.lastName as "lastName"',
        'user.email as "email"',
        'user.modified as "modified"',
        'location.id as "locationId"',
      ])
      .innerJoin('user_location.user', 'user')
      .leftJoin(
        'user_location.location',
        'location',
        'location.deleted = false',
      );

    if (locationId) {
      query.andWhere('user_location.location_id = :locationId', { locationId });
    }
    if (search) {
      query.andWhere(
        'user.firstName ILIKE :filter OR user.lastName ILIKE :filter',
        { filter },
      );
    }
    if (!includeDeleted) {
      // separate out filtering deleted users and deleted locations later?
      query.andWhere(`
      user_location.deleted = false
      AND location.deleted = false
      AND user.deleted = false`);
    }
    query.groupBy('user.id, user_location.id, location.id');
    const count = await query.getCount();

    query.take(limit).skip(offset);
    if (order) {
      query.orderBy(order);
    } else {
      query.orderBy('user.lastName', 'DESC');
    }
    const rawMany = await query.getRawMany();
    return [rawMany, count];
  }

  @Transaction()
  public async save(
    userId: number,
    currentUserId: number,
    locations: number[],
    @TransactionRepository(UserLocation)
    userLocationRepository?: Repository<UserLocation>,
  ): Promise<void> {
    const { notAssignedToLocation, savingFailed } = UserLocationExceptions;
    const prevUserLocations = await this.getAllByUserId(userId);
    const prevUserLocationMap = new Map(
      prevUserLocations.map(
        userLocation =>
          [
            userLocation.location && userLocation.location.id,
            userLocation.id,
          ] as [number, number],
      ),
    );
    const nextLocationSet = new Set(locations);
    const assignmentPromises: Promise<any>[] = [];

    nextLocationSet.forEach(locationId => {
      if (!prevUserLocationMap.has(locationId)) {
        const promise = this.hasPermission(currentUserId, locationId).then(
          hasPermission => {
            if (hasPermission) {
              return this._create(
                userLocationRepository,
                userId,
                locationId,
                currentUserId,
              );
            } else {
              throw new GDExpectedException(notAssignedToLocation);
            }
          },
        );
        assignmentPromises.push(promise);
      }
    });

    prevUserLocationMap.forEach((userLocationId, locationId) => {
      if (!nextLocationSet.has(locationId)) {
        const promise = this.hasPermission(currentUserId, locationId).then(
          hasPermission => {
            if (hasPermission) {
              return this._delete(
                userLocationRepository,
                userLocationId,
                currentUserId,
              );
            } else {
              throw new GDExpectedException(notAssignedToLocation);
            }
          },
        );
        assignmentPromises.push(promise);
      }
    });

    try {
      await Promise.all(assignmentPromises);
      return;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new GDExpectedException(savingFailed);
      }
    }
  }

  public async create(
    userId: number,
    location: Location | number,
    modifiedBy: number,
  ): Promise<UserLocation> {
    try {
      const createResult = await this._create(
        this.userLocationRepository,
        userId,
        location,
        modifiedBy,
      );
      return createResult;
    } catch (error) {
      throw error;
    }
  }

  public async update(
    id: number,
    modifiedBy: number,
    location?: Location | number,
  ): Promise<UserLocation> {
    try {
      const updateResult = await this._update(
        this.userLocationRepository,
        id,
        modifiedBy,
        location,
      );
      return updateResult;
    } catch (error) {
      throw error;
    }
  }

  public async delete(
    assignment: UserLocation | number,
    modifiedBy: number,
  ): Promise<UpdateResult> {
    try {
      return this._delete(this.userLocationRepository, assignment, modifiedBy);
    } catch (error) {
      throw error;
    }
  }

  public async removeNonAssignedUserLocations(
    modifiedBy: number,
  ): Promise<void> {
    try {
      const nonAssignedLocations = await this.userLocationRepository.find({
        location: null,
      });
      await this._deleteAll(nonAssignedLocations, modifiedBy);
      return;
    } catch (error) {
      throw error;
    }
  }

  public async hasPermission(
    currentUserId: number,
    modifiedLocationId: number | null,
  ): Promise<boolean> {
    const user = await this.userService.findById(currentUserId);
    let userAssignedLocations = [];
    if (user.roles[0].name !== RoleEnum.Admin) {
      userAssignedLocations = await this.getAllByUserId(currentUserId);
    }

    return !UserLocationExceptions.notAssignedToLocation.failCondition({
      user: user as User,
      currentLocationId: modifiedLocationId,
      userAssignedLocations,
    });
  }

  private async _create(
    repository: Repository<UserLocation>,
    userId: number,
    location: Location | number,
    modifiedBy: number,
  ): Promise<UserLocation> {
    try {
      const user = new User();
      user.id = userId;
      const currLocation = location as Location;
      let assignment = await repository.findOne({
        where: {
          user: user.id,
          location: currLocation,
        },
      });
      if (!assignment) {
        assignment = await repository.create({
          user,
          location: currLocation,
          modifiedBy,
          createdBy: modifiedBy,
        });
      }
      assignment.deleted = false;
      return repository.save(assignment);
    } catch (error) {
      throw error;
    }
  }

  private async _update(
    repository: Repository<UserLocation>,
    id: number,
    modifiedBy: number,
    location?: Location | number,
  ): Promise<UserLocation> {
    try {
      const assignment = await this.getOne(id);
      if (location) {
        assignment.location = location as Location;
      }
      assignment.modifiedBy = modifiedBy;
      return repository.save(assignment);
    } catch (error) {
      throw error;
    }
  }

  private async _delete(
    repository: Repository<UserLocation>,
    assignment: UserLocation | number,
    modifiedBy: number,
  ): Promise<UpdateResult> {
    const assignmentId =
      (assignment as UserLocation).id || (assignment as number);
    try {
      return repository.update(assignmentId, {
        modifiedBy,
        deleted: true,
      });
    } catch (error) {
      throw error;
    }
  }

  private async _deleteAll(
    assignments: UserLocation[],
    modifiedBy: number,
  ): Promise<void> {
    try {
      const unassignedLocations: Promise<UpdateResult>[] = [];
      assignments.forEach(assignment => {
        unassignedLocations.push(
          this._delete(this.userLocationRepository, assignment, modifiedBy),
        );
      });
      await Promise.all(unassignedLocations);
    } catch (error) {
      throw error;
    }
  }
}
