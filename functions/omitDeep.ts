/* https://github.com/lodash/lodash/issues/723#issuecomment-677383457 */

const omitDeep = (input: Record<string, any>, excludes: Array<number | string>): Record<string, any> => {
  return Object.entries(input).reduce((nextInput, [key, value]) => {
    const shouldExclude = excludes.includes(key);
    if (shouldExclude) { return nextInput; }

    if (Array.isArray(value)) {
      const arrValue = value;
      const nextValue = arrValue.map((arrItem) => {
        if (typeof arrItem === 'object' && arrItem !== null) {
          return omitDeep(arrItem, excludes);
        }
        return arrItem;
      });
      (nextInput as any)[key] = nextValue;
      return nextInput;
    } else if (typeof value === 'object') {
      (nextInput as any)[key] = omitDeep(value, excludes);
      return nextInput;
    }

    (nextInput as any)[key] = value;

    return nextInput;
  }, {});
};

export { omitDeep };
