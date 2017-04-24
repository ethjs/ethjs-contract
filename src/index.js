const Contract = require('./contract');
const abi = require('ethjs-abi'); // eslint-disable-line
const getKeys = require('ethjs-util').getKeys; // eslint-disable-line
const hasTransactionObject = require('./has-tx-object');

function getConstructorFromABI(contractABI) {
  return contractABI.filter((json) => (json.type === 'constructor'))[0];
}

function contractFactory(query) {
  return function ContractFactory(contractABI, contractBytecode, contractDefaultTxObject) {
    const output = {};

    output.at = function atContract(address) {
      return new Contract({
        address,
        query,
        contractBytecode,
        contractDefaultTxObject,
        contractABI,
      });
    };

    output.new = function newContract() {
      var providedTxObject = {}; // eslint-disable-line
      var newMethodCallback = () => {}; // eslint-disable-line
      const newMethodArgs = [].slice.call(arguments); // eslint-disable-line
      if (typeof newMethodArgs[newMethodArgs.length - 1] === 'function') newMethodCallback = newMethodArgs.pop();
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

      return query.sendTransaction(assembleTxObject, newMethodCallback);
    };

    return output;
  };
}

function EthContract(query) {
  return contractFactory(query);
}

module.exports = EthContract;
