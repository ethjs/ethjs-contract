const abi = require('ethjs-abi'); // eslint-disable-line
const sha3 = require('ethjs-sha3'); // eslint-disable-line
const EthFilter = require('ethjs-filter'); // eslint-disable-line
const getKeys = require('ethjs-util').getKeys; // eslint-disable-line
const arrayContainsArray = require('ethjs-util').arrayContainsArray;

function hasTransactionObject(args) {
  const txObjectProperties = ['from', 'to', 'data', 'value', 'gasPrice', 'gas'];
  if (typeof args === 'object' && Array.isArray(args) === true && args.length > 0) {
    if (typeof args[args.length - 1] === 'object'
      && (Object.keys(args[args.length - 1]).length === 0
      || arrayContainsArray(Object.keys(args[args.length - 1]), txObjectProperties, true))) {
      return true;
    }
  }

  return false;
}

function getConstructorFromABI(contractABI) {
  return contractABI.filter((json) => (json.type === 'constructor'))[0];
}

function getCallableMethodsFromABI(contractABI) {
  return contractABI.filter((json) => ((json.type === 'function' || json.type === 'event') && json.name.length > 0));
}

function contractFactory(query) {
  return function ContractFactory(contractABI, contractBytecode, contractDefaultTxObject) {
    const output = {};
    output.at = function atContract(address) {
      function Contract() {
        if (!(this instanceof Contract)) { throw new Error('the ContractFactory instance requires the "new" flag in order to function normally.'); }

        const self = this;
        self.abi = contractABI || [];
        self.query = query;
        self.address = address || '0x';
        self.bytecode = contractBytecode || '0x';
        self.defaultTxObject = contractDefaultTxObject || {};
        self.filters = new EthFilter(query);

        getCallableMethodsFromABI(contractABI).forEach((methodObject) => {
          self[methodObject.name] = function contractMethod() { // eslint-disable-line
            var queryMethod = 'call'; // eslint-disable-line
            var providedTxObject = {}; // eslint-disable-line
            const methodArgs = [].slice.call(arguments); // eslint-disable-line
            const methodCallback = methodArgs.pop();

            function newMethodCallback(callbackError, callbackResult) {
              if (queryMethod === 'call' && !callbackError) {
                if (methodObject.type === 'event') {
                  methodCallback(callbackError, abi.decodeEvent(methodObject, callbackResult));
                } else {
                  methodCallback(callbackError, abi.decodeMethod(methodObject, callbackResult));
                }
              } else {
                methodCallback(callbackError, callbackResult);
              }
            }

            if (methodObject.type === 'function') {
              if (hasTransactionObject(methodArgs)) providedTxObject = methodArgs.pop();
              const methodTxObject = Object.assign(
                self.defaultTxObject,
                providedTxObject, {
                  to: self.address,
                });
              methodTxObject.data = abi.encodeMethod(methodObject, methodArgs);

              if (methodObject.constant === false) {
                queryMethod = 'sendTransaction';
              }

              query[queryMethod](methodTxObject, newMethodCallback);
            } else if (methodObject.type === 'event') {
              const filterInputTypes = getKeys(methodObject.inputs, 'type', false);
              const filterTopic = sha3(`${methodObject.name}(${filterInputTypes.join(',')})`);
              const argsObject = Object.assign({}, methodArgs[0]) || {};
              const filterObject = Object.assign(argsObject, {
                to: self.address,
                topics: [filterTopic],
              });

              return new self.filters.Filter(filterObject, methodCallback);
            }
          };
        });
      }

      return new Contract();
    };

    output.new = function newContract() {
      var providedTxObject = {}; // eslint-disable-line
      const newMethodArgs = [].slice.call(arguments); // eslint-disable-line
      const newMethodCallback = newMethodArgs.pop(); // eslint-disable-line
      if (hasTransactionObject(newMethodArgs)) providedTxObject = newMethodArgs.pop();
      const constructMethod = getConstructorFromABI(contractABI);
      const assembleTxObject = Object.assign({}, contractDefaultTxObject, providedTxObject);

      // if contract bytecode was predefined
      if (contractBytecode) {
        assembleTxObject.data = contractBytecode;
      }

      // if constructor bytecode
      if (constructMethod) {
        const constructBytecode = abi.encodeParams(getKeys(constructMethod.inputs, 'type'), newMethodArgs).substring(2); // eslint-disable-line
        assembleTxObject.data = `${assembleTxObject.data}${constructBytecode}`;
      }

      query.sendTransaction(assembleTxObject, newMethodCallback);
    };

    return output;
  };
}

function EthContract(query) {
  return contractFactory(query);
}

module.exports = EthContract;
