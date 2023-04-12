import "reflect-metadata";

import { afterEach, beforeEach, test } from "node:test";
import { DataSource, createConnection } from "typeorm";
import { TypeORMOptimisticLockTest } from "./test.entity";
import { typeormOptimisticLockSave } from "./index";
import assert from "assert";

let connection: DataSource;

beforeEach(async () => {
  connection = await createConnection({
    entities: ["test.entity.ts"],
    type: "postgres",
    database: "postgres",
    username: "postgres",
    password: "postgres",
    synchronize: true,
  });

  await connection.getRepository(TypeORMOptimisticLockTest).clear();
});

afterEach(async () => {
  await connection.destroy();
});

test("basic insert works", async () => {
  await typeormOptimisticLockSave({
    repository: connection.getRepository(TypeORMOptimisticLockTest),
    conflictError: new Error("test"),
    forInsert: { id: 1, text: "foo bar", version: 1 },
  });

  const entity = await connection
    .getRepository(TypeORMOptimisticLockTest)
    .findOneBy({ id: 1 });

  assert.ok(entity);
  assert.strictEqual(entity.text, "foo bar");
  assert.strictEqual(entity.version, 1);
});

test("fails with conflict on insert", async () => {
  await connection.getRepository(TypeORMOptimisticLockTest).save({
    id: 1,
    text: "foo bar",
    version: 1,
  });

  const conflictError = new Error("test");
  await assert.rejects(
    () =>
      typeormOptimisticLockSave({
        repository: connection.getRepository(TypeORMOptimisticLockTest),
        conflictError,
        forInsert: { id: 1, text: "foo bar", version: 1 },
      }),
    conflictError
  );
});

test("basic update works", async () => {
  await connection.getRepository(TypeORMOptimisticLockTest).save({
    id: 1,
    text: "foo bar",
    version: 1,
  });

  await typeormOptimisticLockSave({
    repository: connection.getRepository(TypeORMOptimisticLockTest),
    conflictError: new Error("test"),
    forUpdate: { id: 1, text: "test", version: 2 },
    whereUpdate: { id: 1, version: 1 },
  });

  const entity = await connection
    .getRepository(TypeORMOptimisticLockTest)
    .findOneBy({ id: 1 });

  assert.ok(entity);
  assert.strictEqual(entity.text, "test");
  assert.strictEqual(entity.version, 2);
});

test("fails with conflict on update", async () => {
  await connection.getRepository(TypeORMOptimisticLockTest).save({
    id: 1,
    text: "another update",
    version: 2,
  });

  const conflictError = new Error("test");
  await assert.rejects(
    () =>
      typeormOptimisticLockSave({
        repository: connection.getRepository(TypeORMOptimisticLockTest),
        conflictError,
        forUpdate: { id: 1, text: "test", version: 2 },
        whereUpdate: { id: 1, version: 1 },
      }),
    conflictError
  );
});

test("any persistance option should be provided", async () => {
  const error = new Error(
    "For updating 'forUpdate', 'whereUpdate' options should be provided, for inserting 'forInsert' accordingly"
  );
  await assert.rejects(
    () =>
      typeormOptimisticLockSave({
        repository: connection.getRepository(TypeORMOptimisticLockTest),
        conflictError: error,
      }),
    error
  );
});

test("version: 1 required for inserting", async () => {
  const error = new Error(
    "forInsert.version: 1 should be passed for inserting"
  );
  await assert.rejects(
    () =>
      typeormOptimisticLockSave({
        repository: connection.getRepository(TypeORMOptimisticLockTest),
        conflictError: error,
        forInsert: { id: 1, text: "foo bar", version: -1 },
      }),
    error
  );
});

test("for updating versions should be differ by 1", async () => {
  const error = new Error(
    "For updating whereUpdate.version: n and forUpdate.version: n + 1 should be provided"
  );
  await assert.rejects(
    () =>
      typeormOptimisticLockSave({
        repository: connection.getRepository(TypeORMOptimisticLockTest),
        conflictError: error,
        forUpdate: { id: 1, text: "test", version: 3 },
        whereUpdate: { id: 1, version: 1 },
      }),
    error
  );
});
