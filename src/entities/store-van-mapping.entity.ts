import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiModelProperty } from '@nestjs/swagger';

@Entity()
export class StoreVanMapping {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @Column('int', { name: 'store_id', nullable: true })
  public storeId: number;

  @Column('int', { name: 'van_id', nullable: true })
  public driverId: number;
}
