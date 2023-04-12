# typeorm-optimistic-lock

TypeORM helper for optimistic lock persistance

## Notes

* This library tested only for Postgres, but potentially can be improved for any database
* You should manually detect type of persistance: insert or update. Detected by entity existance while fetching as usual
* Entity should have required integer property `version`
* On inserting need to set `version: 1`
* On updating in `whereUpdate` need to use current `version`, in `forUpdate` need to set current `version` + 1

## Insert example

```ts
import { typeormOptimisticLockSave } from "typeorm-optimistic-lock";

await typeormOptimisticLockSave({
  repository: connection.getRepository(Test),
  conflictError: new Error("conflict happens"),
  forInsert: { id: 1, text: "foo bar", version: 1 },
});
```

## Update example

```ts
import { typeormOptimisticLockSave } from "typeorm-optimistic-lock";

await typeormOptimisticLockSave({
  repository: connection.getRepository(Test),
  conflictError: new Error("conflict happens"),
  forUpdate: { id: 1, text: "test", version: 2 },
  whereUpdate: { id: 1, version: 1 },
});
```
