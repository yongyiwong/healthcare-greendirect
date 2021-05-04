import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, getMetadataArgsStorage } from 'typeorm';
import { MetadataArgsStorage } from 'typeorm/metadata-args/MetadataArgsStorage';
import * as Fixtures from '../fixtures';

/**
 * Used to support create of Fixture (mock data) including other entities as nested properties
 */
@Injectable()
export class FixtureService {
  // metadataArgsStorage will be typed on use to work around a strange tsc error
  metadataArgsStorage: any;

  constructor(
    @InjectEntityManager() protected readonly entityManager: EntityManager,
  ) {
    this.metadataArgsStorage = getMetadataArgsStorage();
  }

  /**
   * From the fixture data, create an entity and save it to the database.
   * Also saves any relations you included.
   *
   * @param targetEntity the target Entity class
   * @param overrideValues provide overrides for the default values from fixtures, or used as the actual values if no fixture
   */
  public async saveEntityUsingValues<T extends any>(
    targetEntity: new () => T,
    overrideValues?: DeepPartial<T>,
  ) {
    const fixtureConstructor = Fixtures[targetEntity.name + 'Fixture']; // use the constructor of same-named Fixture.
    const values = fixtureConstructor
      ? fixtureConstructor.new(overrideValues)
      : overrideValues;
    return this._saveEntityUsingValues(targetEntity, values);
  }

  private async _saveEntityUsingValues<T>(
    targetEntity: new () => T,
    values: DeepPartial<T> | DeepPartial<T>[],
  ) {
    let newEntity: any = values;
    let newEntitySaved = false;

    const save = async () => {
      if (!newEntitySaved) {
        newEntity = await this.entityManager.save(
          this.entityManager.create(targetEntity, values as any),
        );
        newEntitySaved = true;
      }
    };

    // check for relations and save them
    const relations = (this
      .metadataArgsStorage as MetadataArgsStorage).filterRelations(
      targetEntity,
    );

    for (const property of Object.keys(values)) {
      if (values[property] == null) {
        // skip null or undefined properties, if it somehow got included
        continue;
      }

      const relation = relations.find(r => r.propertyName === property);

      if (relation) {
        if (relation.options.cascade) {
          // skip manually saving relations if cascade option is true,
          // it will be saved when parent saves anyway
          continue;
        }

        let relatedEntity = values[property];

        const relationTypeFn = relation.type as () => new () => any;
        const relationType = relationTypeFn();

        if (relation.relationType === 'one-to-many') {
          // save left entity first before relations if one-to-many
          await save();

          const inverseRelation = (this
            .metadataArgsStorage as MetadataArgsStorage)
            .filterRelations(relationType)
            .find(r => {
              const inverseRelationType = r.type as () => new () => any;
              return inverseRelationType() === targetEntity;
            });

          if (inverseRelation) {
            const inverseProperty = inverseRelation.propertyName;

            if (Array.isArray(relatedEntity)) {
              relatedEntity = relatedEntity.map(related => {
                related[inverseProperty] = newEntity;
                return related;
              });
            } else {
              relatedEntity[inverseProperty] = newEntity;
            }
          }
        }

        newEntity[property] = await this._saveEntityUsingValues(
          relationType,
          relatedEntity,
        );

        if (relation.relationType === 'many-to-one') {
          // save left entity last when many-to-one
          await save();
        }
      }
    }

    await save();
    return newEntity;
  }
}
