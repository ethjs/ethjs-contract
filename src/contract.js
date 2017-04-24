const abi = require('ethjs-abi'); // eslint-disable-line
const EthFilter = require('ethjs-filter'); // eslint-disable-line
const getKeys = require('ethjs-util').getKeys; // eslint-disable-line
const keccak256 = require('js-sha3').keccak_256; // eslint-disable-line
const hasTransactionObject = require('./has-tx-object');

function Contract(opts = {}) {
  const self = this;
  self.abi = opts.contractABI || [];
  self.query = opts.query;
  self.address = opts.address || '0x';
  self.bytecode = opts.contractBytecode || '0x';
  self.defaultTxObject = opts.contractDefaultTxObject || {};
  self.filters = new EthFilter(self.query);

  getCallableMethodsFromABI(self.abi).forEach((methodObject) => {
    self[methodObject.name] = function contractMethod() { // eslint-disable-line
      var queryMethod = 'call'; // eslint-disable-line
      var providedTxObject = {}; // eslint-disable-line
      var methodCallback = () => {}; // eslint-disable-line
      const methodArgs = [].slice.call(arguments); // eslint-disable-line
      if (typeof methodArgs[methodArgs.length - 1] === 'function') {
        methodCallback = methodArgs.pop();
      }

      if (methodObject.type === 'function') {
        return new Promise((resolve, reject) => {
          function newMethodCallback(callbackError, callbackResult) {
            if (queryMethod === 'call' && !callbackError) {
              try {
                const decodedMethodResult = abi.decodeMethod(methodObject, callbackResult);

                resolve(decodedMethodResult);
                methodCallback(null, decodedMethodResult);
              } catch (decodeFormattingError) {
                const decodingError = new Error(`[ethjs-contract] while formatting incoming raw call data ${JSON.stringify(callbackResult)} ${decodeFormattingError}`);

                reject(decodingError);
                methodCallback(decodingError, null);
              }
            } else if (queryMethod === 'sendTransaction' && !callbackError) {
              resolve(callbackResult);
              methodCallback(null, callbackResult);
            } else {
              reject(callbackError);
              methodCallback(callbackError, null);
            }
          }

          if (hasTransactionObject(methodArgs)) providedTxObject = methodArgs.pop();
          const methodTxObject = Object.assign({},
            self.defaultTxObject,
            providedTxObject, {
              to: self.address,
            });
          methodTxObject.data = abi.encodeMethod(methodObject, methodArgs);

          if (methodObject.constant === false) {
            queryMethod = 'sendTransaction';
          }

          self.query[queryMethod](methodTxObject, newMethodCallback);
        });
      } else if (methodObject.type === 'event') {
        const filterInputTypes = getKeys(methodObject.inputs, 'type', false);
        const filterTopic = `0x${keccak256(`${methodObject.name}(${filterInputTypes.join(',')})`)}`;
        const argsObject = Object.assign({}, methodArgs[0]) || {};

        return new self.filters.Filter(Object.assign({}, argsObject, {
          decoder: (logData) => abi.decodeEvent(methodObject, logData),
          defaultFilterObject: Object.assign({}, (methodArgs[0] || {}), {
            to: self.address,
            topics: [filterTopic],
          }),
        }));
      }
    };
  });
}

function getCallableMethodsFromABI(contractABI) {
  return contractABI.filter((json) => ((json.type === 'function' || json.type === 'event') && json.name.length > 0));
}

module.exports = Contract;
