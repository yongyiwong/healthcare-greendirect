import { ApiModelProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DeliveryTime {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiModelProperty()
  @Column('int', { nullable: true })
  public storeId: number;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public day: string;

  @ApiModelProperty()
  @Column('text', { nullable: true })
  public timeSlot: string;

  @ApiModelProperty()
  @Column('int', { nullable: true })
  public maxOrdersHour: number;

  @ApiModelProperty()
  @Column('int', { nullable: true })
  public dayNum: number;

  @ApiModelProperty()
  @Column({ default: false })
  public isActive: boolean;
}
