import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class TypeORMOptimisticLockTest {
  @PrimaryColumn("integer")
  id!: number;

  @Column("text")
  text!: string;

  @Column("integer")
  version!: number;
}
