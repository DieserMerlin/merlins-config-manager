export function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Copied from https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge.
 *
 * This method is needed since Object.assign(target, ...sources) only does a shallow copy.
 * The method is taken from StackOverflow because it worked out of the box.
 * Credits to the author.
 * @param target The target object.
 * @param sources The source objects.
 */
export function mergeConfigs(target: any, ...sources: any): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, {[key]: {}});
        mergeConfigs(target[key], source[key]);
      } else {
        Object.assign(target, {[key]: source[key]});
      }
    }
  }

  return mergeConfigs(target, ...sources);
}
