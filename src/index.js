const abi = require('ethjs-abi'); // eslint-disable-line
const sha3 = require('ethjs-sha3'); // eslint-disable-line
const EthFilter = require('ethjs-filter'); // eslint-disable-line
const getKeys = require('ethjs-util').getKeys; // eslint-disable-line

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
        self.abi = contractABI;
        self.query = query;
        self.address = address;
        self.bytecode = contractBytecode;
        self.defaultTxObject = contractDefaultTxObject;
        self.filters = new EthFilter(query);

        getCallableMethodsFromABI(contractABI).forEach((methodObject) => {
          self[methodObject.name] = function contractMethod() { // eslint-disable-line
            var queryMethod = 'call'; // eslint-disable-line
            const methodArgs = [].slice.call(arguments); // eslint-disable-line
            const methodCallback = methodArgs.pop();
            const methodTxObject = Object.assign({
              to: self.address,
            }, contractDefaultTxObject);
            methodTxObject.data = abi.encodeMethod(methodObject, methodArgs);

            if (methodObject.type === 'function') {
              if (methodObject.constant === false) {
                queryMethod = 'sendTransaction';
              }

              query[queryMethod](methodTxObject, methodCallback);
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
      const newMethodArgs = [].slice.call(arguments); // eslint-disable-line
      const newMethodCallback = newMethodArgs.pop(); // eslint-disable-line
      const constructMethod = getConstructorFromABI(contractABI);
      const assembleTxObject = Object.assign({}, contractDefaultTxObject);

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
