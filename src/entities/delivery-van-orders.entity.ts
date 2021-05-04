import { ApiModelProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DeliveryVanOrders {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @Column('int', { nullable: true })
  public driverId: number;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public timeSlot: string;

  @ApiModelProperty()
  @Column('int', { nullable: true })
  public maxOrdersPerHour: number;

  @ApiModelProperty()
  @Column('int', { nullable: true })
  public counter: number;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public date: string;

  @ApiModelProperty()
  @Column('int', { nullable: true })
  public locationId: number;
}
