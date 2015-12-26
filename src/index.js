const isArray = Array.isArray;
const isPlainObject = require('lodash.isplainobject');
const merge = require('lodash.merge');
const find = require('lodash.find');

const loaderNameRe = new RegExp(/[a-z\-]/ig);

function reduceLoaders(mergedLoaderConfigs, loaderConfig) {
  const foundLoader = find(mergedLoaderConfigs, l => String(l.test) === String(loaderConfig.test));

  // foundLoader.loader is intentionally ignored, because a string loader value should always override
  if (foundLoader && foundLoader.loaders) {
    const newLoaders = loaderConfig.loader ? [loaderConfig.loader] : loaderConfig.loaders || [];

    foundLoader.loaders = newLoaders.reduce((mergedLoaders, loader) => {
      const loaderName = loader.match(loaderNameRe)[0];

      if (mergedLoaders.every(l => loaderName !== l.match(loaderNameRe)[0])) {
        return [loader, ...mergedLoaders];
      }
      return mergedLoaders;
    }, foundLoader.loaders);

  } else if (!foundLoader) {
    return [loaderConfig, ...mergedLoaderConfigs];
  }

  return mergedLoaderConfigs;
}

function joinArrays(customizer, a, b, key) {
  if (isArray(a) && isArray(b)) {
    const customResult = customizer(a, b, key);

    if (customResult) {
      return customResult;
    }

    return b.concat(a);
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    return merge(a, b, joinArrays);
  }

  return a;
}

module.exports = function () {
  const args = Array.prototype.slice.call(arguments);
  args.reverse();

  return merge.apply(null, [{}].concat(args).concat([
    joinArrays.bind(null, () => {})
  ]));
};

module.exports.smart = function webpackMerge() {
  const args = Array.prototype.slice.call(arguments);
  args.reverse();

  return merge.apply(null, [{}].concat(args).concat([
    joinArrays.bind(null, function (a, b, key) {
      if (key === 'loaders') {
        return b.reduce(reduceLoaders, a.slice());
      }
    })
  ]));
};
