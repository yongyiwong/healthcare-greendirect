import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { LocationDeal } from './location-deal.entity';
import { DealDay } from './deal-day.entity';
import { ColumnDateHoursRoundingTransformer } from '../common/transformers/column-date-hours-rounding.transformer';
import { ColumnFalsyToNullTransformer } from '../common/transformers/column-falsy-to-null.transformer';
import { DealCategory } from '../deal/deal-category.enum';

export const DEFAULT_TZ = 'America/Puerto_Rico';
export const RANDOM_PRIORITY_OPTION = 0;

@Entity()
export class Deal {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @Column('text', { nullable: false })
  public title: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public dealId: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public description: string;

  @ApiModelPropertyOptional()
  @Column('text', { nullable: true })
  public imageUrl: string;

  @OneToMany(
    type => DealDay,
    dealDay => dealDay.deal,
    {
      cascade: true,
    },
  )
  public dealDays: DealDay[];

  /**
   * Many to Many relationship with Locations
   * A location offers many deals, and a deal can be offered by multiple locations.
   * Location <- LocationDeal -> Deal
   */
  @OneToMany(
    type => LocationDeal,
    dealLocation => dealLocation.deal,
  )
  public dealLocations: LocationDeal[];

  /**
   * Date when deal appears in Deals section.
   */
  @ApiModelProperty()
  @Column('timestamp', {
    nullable: true,
    transformer: new ColumnDateHoursRoundingTransformer(),
  })
  public startDate: Date;

  /**
   * Date when deal no longer appears in Deals section (no longer offered)
   */
  @ApiModelProperty()
  @Column('timestamp', {
    nullable: true,
    transformer: new ColumnDateHoursRoundingTransformer(false),
  })
  public endDate: Date;

  /**
   * Refers to validity of "claimed" deals
   * It may or may not appear on Deals section through this date since it is unrelated.
   */
  @ApiModelProperty()
  @Column('timestamp', {
    nullable: true,
    transformer: new ColumnDateHoursRoundingTransformer(false),
  })
  public expirationDate: Date;

  @ApiModelPropertyOptional()
  @Column('text', {
    name: 'timezone',
    nullable: true,
    default: DEFAULT_TZ,
  })
  public timezone: string;

  @ApiModelProperty()
  @Column({ default: false })
  public deleted: boolean;

  @ApiModelProperty()
  @Column('smallint', { default: RANDOM_PRIORITY_OPTION })
  public priority: number;

  @ApiModelPropertyOptional()
  @Column('smallint', {
    nullable: true,
    transformer: new ColumnFalsyToNullTransformer(),
  })
  @Index('deal_category_idx')
  public category: DealCategory;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelPropertyOptional()
  @Column({ name: 'created_by', nullable: true })
  public createdBy: number;

  @ApiModelProperty()
  @UpdateDateColumn()
  public modified: Date;

  @ApiModelPropertyOptional()
  @Column({ name: 'modified_by', nullable: true })
  public modifiedBy: number;
}
