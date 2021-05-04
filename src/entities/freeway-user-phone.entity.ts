import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { ApiModelProperty } from '@nestjs/swagger';

import { FreewayUser } from './freeway-user.entity';

@Entity()
export class FreewayUserPhone {
  @ApiModelProperty()
  @PrimaryColumn()
  public posId: number;

  @ManyToOne(type => FreewayUser)
  @JoinColumn({ name: 'freeway_user_id' })
  public freewayUser: FreewayUser;

  @Column({ name: 'org_id', nullable: true })
  public orgId: number;

  @Column('text', { nullable: true })
  public type: string;

  @Column('text', { nullable: true })
  public number: string;

  @Column({ nullable: true })
  public active: boolean;

  @Column({ nullable: true })
  public sms: boolean;

  @Column({ nullable: true })
  public created: Date;

  @Column({ nullable: true })
  public modified: Date;

  @Column({ nullable: true })
  public deleted: Date;
}
