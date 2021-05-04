import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

@Entity()
export class OrderTax {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  public id: number;

  @Column('numeric', { precision: 7, scale: 2, default: 0 })
  public stateTax: number;

  @Column('numeric', { precision: 7, scale: 2, default: 0 })
  public muniTax: number;

  @Column('numeric', { precision: 7, scale: 2, nullable: true })
  public others: number;

  @ApiModelProperty()
  @CreateDateColumn()
  public created: Date;

  @ApiModelProperty()
  @Column({ nullable: true })
  public createdBy: number;

  @ApiModelPropertyOptional()
  @UpdateDateColumn()
  public modified: Date;

  @Column({ name: 'modified_by', nullable: true })
  public modifiedBy: number;
}
