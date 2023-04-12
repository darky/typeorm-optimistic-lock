import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Test {
  @PrimaryColumn("integer")
  id!: number;

  @Column("text")
  text!: string;

  @Column("integer")
  version!: number;
}
