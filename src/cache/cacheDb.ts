import NodeCache from "node-cache";

// NodeCache instance for global caching
const cache = new NodeCache();

export interface CacheData {
  [key: string]: any;
}

class CacheHandler {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  // Delete all keys starting with the provided prefix
  deleteStartWithThisKey(): void {
    const keys = cache.keys();
    const prefix = this.key; // Use the current key as the prefix

    // Filter and delete keys starting with the given prefix
    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        cache.del(key);
      }
    });
  }

  // Create or Update (sets the key with data)
  set(data: CacheData): void {
    cache.set(this.key, data);
  }

  // Read (retrieves data by key)
  get(): CacheData | [] {
    return cache.get(this.key) || [];
  }

  // Check if key exists
  has(): boolean {
    return cache.has(this.key);
  }

  // Add method to CacheHandler to handle data addition
  add(newData: any): void {
    const existingData = cache.get(this.key);

    if (Array.isArray(existingData)) {
      // Create a new array with the added data to maintain immutability
      const updatedData = [...existingData, newData];
      cache.set(this.key, updatedData);
    } else {
      // Initialize the key with an array if it doesn't exist
      cache.set(this.key, [newData]);
    }
  }

  // Delete (removes the data for the key)
  delete(): void {
    if (cache.has(this.key)) {
      cache.del(this.key);
    } else {
      console.error("Key does not exist.");
    }
  }

  // Update (update an object in the data by criteria)
  update(criteria: { [key: string]: any }, newData: CacheData): void {
    const existingData = cache.get(this.key);

    if (Array.isArray(existingData)) {
      // Find the object by criteria in the array
      const index = existingData.findIndex((item: any) =>
        this.matchesCriteria(item, criteria)
      );

      if (index !== -1) {
        // Merge newData into the existing object
        existingData[index] = this.deepMerge(existingData[index], newData);
        cache.set(this.key, existingData);
      } else {
        throw new Error("Criteria not found in array.");
      }
    } else if (existingData && typeof existingData === "object") {
      // If it's an object, check if it matches the criteria
      if (this.matchesCriteria(existingData, criteria)) {
        cache.set(this.key, this.deepMerge(existingData, newData));
      } else {
        throw new Error("Criteria not found in object.");
      }
    } else {
      throw new Error("Data is not an array or object.");
    }
  }

  // Delete specific data (remove an object by criteria)
  deleteWhere(criteria: { [key: string]: any }): void {
    const existingData = cache.get(this.key);

    if (Array.isArray(existingData)) {
      // Filter out items that match the criteria
      const updatedData = existingData.filter(
        (item) => !this.matchesCriteria(item, criteria)
      );
      cache.set(this.key, updatedData);
    } else if (existingData && typeof existingData === "object") {
      // If the data is a single object, check if it matches the criteria
      if (this.matchesCriteria(existingData, criteria)) {
        cache.set(this.key, {}); // Clear the object if it matches
      } else {
        throw new Error(`Criteria not found in object ${this.key}`);
      }
    } else {
      throw new Error(`Data is not an array or object for ${this.key}`);
    }
  }

  find(criteria: { [key: string]: any }): CacheData[] {
    const existingData = cache.get(this.key);

    if (Array.isArray(existingData)) {
      // Filter the array based on the criteria
      return existingData.filter((item) =>
        Object.keys(criteria).every((key) => {
          const criteriaValue = criteria[key];
          const itemValue = item[key];

          // Support nested objects
          if (
            typeof criteriaValue === "object" &&
            typeof itemValue === "object"
          ) {
            return this.matchesCriteria(itemValue, criteriaValue);
          }
          return itemValue === criteriaValue;
        })
      );
    } else if (existingData && typeof existingData === "object") {
      // For single objects, check if it matches the criteria
      if (this.matchesCriteria(existingData, criteria)) {
        return [existingData];
      }
    }

    return []; // Return empty array if no matches
  }
  /**
   * Deep merge two objects, preserving nested properties.
   */
  private deepMerge(
    target: { [key: string]: any },
    source: { [key: string]: any }
  ): { [key: string]: any } {
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        // Recursively merge objects
        target[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        // Directly assign values
        target[key] = source[key];
      }
    }
    return target;
  }

  /**
   * Helper method to check if an item matches the given criteria.
   */
  private matchesCriteria(
    item: { [key: string]: any },
    criteria: { [key: string]: any }
  ): boolean {
    return Object.keys(criteria).every((key) => {
      const criteriaValue = criteria[key];
      const itemValue = item[key];

      // Support for nested objects
      if (typeof criteriaValue === "object" && typeof itemValue === "object") {
        return this.matchesCriteria(itemValue, criteriaValue);
      }
      return itemValue === criteriaValue;
    });
  }
}

// DynamicCacheHandler with index signature to support any key
class DynamicCacheHandler {
  // Index signature to allow dynamic keys
  [key: string]: {
    set: (data: CacheData) => void;
    get: () => CacheData;
    update: (criteria: { [key: string]: any }, newData: CacheData) => void;
    add: (newData: any) => void;
    deleteWhere: (criteria: { [key: string]: any }) => void;
    delete: () => void;
    has: () => boolean;
    find: (criteria: { [key: string]: any }) => CacheData[];
    deleteStartWithThisKey: () => void;
  };

  constructor() {
    // A "Proxy" to dynamically handle the key access
    return new Proxy(this, {
      get(target, prop: string) {
        if (typeof prop === "string") {
          // Return a CacheHandler instance for each dynamic key
          const cacheHandler = new CacheHandler(prop);

          // Return the cache operations on that key
          return {
            set: (data: CacheData) => cacheHandler.set(data),
            get: () => cacheHandler.get(),
            update: (criteria: { [key: string]: any }, newData: CacheData) =>
              cacheHandler.update(criteria, newData),
            add: (newData: any) => cacheHandler.add(newData),
            deleteWhere: (criteria: { [key: string]: any }) =>
              cacheHandler.deleteWhere(criteria),
            delete: () => cacheHandler.delete(),
            has: () => cacheHandler.has(),
            find: (criteria: { [key: string]: any }) =>
              cacheHandler.find(criteria),
            deleteStartWithThisKey: () => cacheHandler.deleteStartWithThisKey(),
          };
        }
      },
    });
  }
}

export const VibeCacheDb = new DynamicCacheHandler();
