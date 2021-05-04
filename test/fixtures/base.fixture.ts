export class BaseFixture {
  /**
   * Create an instance of the Fixture.
   * @param this A fake parameter, only in ts, used to type this.
   * @param overrideValues Overwrite default values
   *
   * @example
   * // use default values
   * const brand = BrandFixture.new();
   * @example
   * // with overridden values
   * const brand = BrandFixture.new({ name: 'Mock Brand' });
   */
  static new<T>(this: new () => T, overrideValues?: { [key: string]: any }): T {
    return Object.assign(new this(), overrideValues);
  }

  /**
   * In javascript, the order of execution when instantiating classes is this
   * 1. Base class initialized properties are initialized
   * 2. Base class constructor runs
   * 3. Derived class initialized properties are initialized
   * 4. Derived class constructor runs
   * Due to this order, overriding values sometimes doesn't work on fixtures,
   * which makes your new object to have the default values.
   * ! Please use the static method new() as a workaround for this.
   * We'll keep the constructor for now.
   */
  constructor(overrideValues?: { [key: string]: any }) {
    if (overrideValues) {
      Object.assign(this, overrideValues);
    }
  }
}
