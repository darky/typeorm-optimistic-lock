import type { FindOptionsWhere, Repository } from "typeorm";

export const typeormOptimisticLockSave = async <T extends { version: number }>({
  repository,
  forInsert,
  forUpdate,
  whereUpdate,
  conflictError,
}: {
  repository: Repository<T>;
  forInsert?: Partial<T> & { version: number };
  forUpdate?: Partial<T> & { version: number };
  whereUpdate?: FindOptionsWhere<T> & { version: number };
  conflictError: Error;
}) => {
  if (forInsert) {
    if (forInsert.version !== 1) {
      throw new Error("forInsert.version: 1 should be passed for inserting");
    }

    try {
      const inserted = await repository.insert(forInsert as any);
      return inserted;
    } catch (err) {
      if (err && (err as { code: string }).code === "23505") {
        throw conflictError;
      }
      throw err;
    }
  } else {
    if (!forUpdate || !whereUpdate) {
      throw new Error(
        "For updating 'forUpdate', 'whereUpdate' options should be provided, for inserting 'forInsert' accordingly"
      );
    }

    if (forUpdate.version - whereUpdate.version !== 1) {
      throw new Error(
        "For updating whereUpdate.version: n and forUpdate.version: n + 1 should be provided"
      );
    }

    const updated = await repository.update(whereUpdate, forUpdate as any);

    if (updated.affected === 0) {
      throw conflictError;
    }

    return updated;
  }
};
