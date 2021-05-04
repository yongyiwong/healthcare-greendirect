import { ApiModelProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DriverDeliveryOrder {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @Column('int', { nullable: true })
  public storeId: number;

  @ApiModelProperty()
  @Column('int', { nullable: true })
  public driverId: number;

  @ApiModelProperty()
  @Column('int', { nullable: true })
  public orderId: number;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public timeSlot: string;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public date: string;
}
