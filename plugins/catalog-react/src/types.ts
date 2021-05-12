/*
 * Copyright 2021 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Entity, UserEntity } from '@backstage/catalog-model';
import { isOwnerOf } from './utils';

export type FilterEnvironment = {
  user: UserEntity | undefined;
  isStarredEntity: (entity: Entity) => boolean;
};

export type EntityFilter = {
  /**
   * Get filters to add to the catalog-backend request. These are a dot-delimited field with
   * value(s) to accept, extracted on the backend by parseEntityFilterParams. For example:
   *   { field: 'kind', values: ['component'] }
   *   { field: 'metadata.name', values: ['component-1', 'component-2'] }
   */
  getCatalogFilters?: () => Record<string, string | string[]>;

  /**
   * Filter entities on the frontend after a catalog-backend request. This function will be called
   * with each backend-resolved entity. This is used when frontend information is required for
   * filtering, such as a user's starred entities.
   *
   * @param entity
   * @param env
   */
  filterEntity?: (entity: Entity, env: FilterEnvironment) => boolean;
};

export class EntityKindFilter implements EntityFilter {
  private readonly _value: string;
  constructor(kind: string) {
    this._value = kind;
  }

  get value() {
    return this._value;
  }

  getCatalogFilters(): Record<string, string | string[]> {
    return { kind: this._value };
  }
}

export class EntityTypeFilter implements EntityFilter {
  private _value: string;
  constructor(type: string) {
    this._value = type;
  }

  get value() {
    return this._value;
  }

  getCatalogFilters(): Record<string, string | string[]> {
    return { 'spec.type': this.value };
  }
}

export class EntityTagFilter implements EntityFilter {
  private _values: string[];
  constructor(values: string[]) {
    this._values = values;
  }

  get values() {
    return this._values;
  }

  filterEntity(entity: Entity): boolean {
    return this.values.every(v => (entity.metadata.tags ?? []).includes(v));
  }
}

export type UserListFilterKind = 'owned' | 'starred' | 'all';
export class UserListFilter implements EntityFilter {
  readonly value: UserListFilterKind;
  constructor(value: UserListFilterKind) {
    this.value = value;
  }

  filterEntity(entity: Entity, env: FilterEnvironment): boolean {
    switch (this.value) {
      case 'owned':
        return env.user !== undefined && isOwnerOf(env.user, entity);
      case 'starred':
        return env.isStarredEntity(entity);
      default:
        return true;
    }
  }
}
