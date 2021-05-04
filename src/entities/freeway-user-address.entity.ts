import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { ApiModelProperty } from '@nestjs/swagger';

import { FreewayUser } from './freeway-user.entity';

@Entity()
export class FreewayUserAddress {
  @ApiModelProperty()
  @PrimaryColumn()
  public posId: number;

  @ManyToOne(type => FreewayUser)
  @JoinColumn({ name: 'freeway_user_id' })
  public freewayUser: FreewayUser;

  @Column({ name: 'org_id', nullable: true })
  public orgId: number;

  @Column('text', { name: 'street_address_1', nullable: true })
  public streetAddress1: string;

  @Column('text', { name: 'street_address_2', nullable: true })
  public streetAddress2: string;

  @Column('text', { nullable: true })
  public city: string;

  @Column('text', { name: 'providence_code', nullable: true })
  public providenceCode: string;

  @Column('text', { name: 'postal_code', nullable: true })
  public postalCode: string;

  @Column('text', { name: 'country_code', nullable: true })
  public countryCode: string;

  @Column({ nullable: true })
  public primary: boolean;

  @Column({ nullable: true })
  public active: boolean;

  @Column({ nullable: true })
  public created: Date;

  @Column({ nullable: true })
  public modified: Date;

  @Column({ nullable: true })
  public deleted: Date;
}
