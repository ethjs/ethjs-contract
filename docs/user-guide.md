# User Guide

All information for developers using `ethjs-contract` should consult this document.

## Install

```
npm install --save ethjs-contract
```

## Usage

```js
const HttpProvider = require('ethjs-provider-http');
const Eth = require('ethjs-query');
const EthContract = require('ethjs-contract');
const eth = new Eth(new HttpProvider('http://localhost:8545'));
const contract = new EthContract(eth);

const SimpleStore = contract(abi, bytecode, defaultTxObject);
const simpleStore = SimpleStore.at('0x000...');
const simpleStore = SimpleStore.new((error, result) => {
  // result null '0x928sdfk...'
});

simpleStore.set(45000, (error, result) => {
  // result null '0x2dfj24...'
});

simpleStore.get().catch((error) => {
  // error null
}).then(result) => {
  // result <BigNumber ...>
});

const filter = simpleStore.SetComplete((error, result) => {
  // result null <BigNumber ...> filterId
});
filter.watch().then((result) => {
  // result null FilterResult {...}
});
filter.stopWatching((error, result) => {
  // result null Boolean filterUninstalled
});
```

## API Design

### constructor

[index.js:ethjs-contract](../../../blob/master/src/index.js "Source code on GitHub")

Intakes an `ethjs-query` instance, outputs a single `contract` instance.

**Parameters**

-   `eth` **Object** a single `ethjs-query` `Eth` instance for RPC formatting, and querying.

Result `contract` **Object**.

```js
const HttpProvider = require('ethjs-provider-http');
const Eth = require('ethjs-query');
const EthContract = require('ethjs-contract');
const eth = new Eth(new HttpProvider('http://localhost:8545'));
const contract = new EthContract(eth);
```

### contract

[index.js:ethjs-contract](../../../blob/master/src/index.js "Source code on GitHub")

Intakes the contract Ethereum standard ABI schema, optionally the contract bytecode and default transaction object. Outputs a `ContractFactory` instance for the contract.

**Parameters**

-   `abi` **Array** a single Ethereum standard contract ABI array
-   `bytecode` **String** [optional] the contract bytecode as a single alphanumeric hex string
-   `defaultTxObject` **Object** [optional] a single default transaction object

Result `ContractFactory` **Object**.

```js
const HttpProvider = require('ethjs-provider-http');
const Eth = require('ethjs-query');
const EthContract = require('ethjs-contract');
const eth = new Eth(new HttpProvider('http://localhost:8545'));
const contract = new EthContract(eth);

// the abi
const SimpleStoreABI = JSON
.parse('[{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"set","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"storeValue","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_newValue","type":"uint256"},{"indexed":false,"name":"_sender","type":"address"}],"name":"SetComplete","type":"event"}]');

// bytecode
const SimpleStoreBytecode = '606060405234610000575b5b5b61010e8061001a6000396000f360606040526000357c01000000000000000000000000000000000000000000000000000000009004806360fe47b1146100435780636d4ce63c14610076575b610000565b346100005761005e6004808035906020019091905050610099565b60405180821515815260200191505060405180910390f35b3461000057610083610103565b6040518082815260200191505060405180910390f35b6000816000819055507f10e8e9bc5a1bde3dd6bb7245b52503fcb9d9b1d7c7b26743f82c51cc7cce917d60005433604051808381526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a1600190505b919050565b600060005490505b9056';

eth.accounts().then((accounts) => {
  const SimpleStore = contract(SimpleStoreABI, SimpleStoreBytecode, {
    from: accounts[0],
    gas: 300000,
  });

  // create a new contract
  const simpleStore = SimpleStore.new((error, result) => {
    // result null '0x928sdfk...' (i.e. the transaction hash)
  });

  // setup an instance of that contract
  const simpleStore = SimpleStore.at('0x000...');
});
```

### ContractFactory.new

[index.js:ethjs-contract](../../../blob/master/src/index.js "Source code on GitHub")

The contract factory has two methods, 'at' and 'new' which can be used to create the contract instane. the `at` method is used to create a `Contract` instance for a contract that has already been deployed to the Ethereum blockchain (testnet, livenet, local or otherwise). The `new` method is used to deploy the contract to the current chain.

**Parameters**

-   [`params`] **Various** the contract constructor input paramaters, if any have been specified, these can be of various types, lengths and requirements depending on the contract constructor.
-   `txObject` **Object** [optional] a web3 standard transaciton JSON object
-   `callback` **Function** [optional] a standard async callback which is fired when the contract has either been created or the transaction has failed.

Result a single Promise **Object** instance.


```js
const HttpProvider = require('ethjs-provider-http');
const Eth = require('ethjs-query');
const EthContract = require('ethjs-contract');
const eth = new Eth(new HttpProvider('http://localhost:8545'));
const contract = new EthContract(eth);

// the abi
const SimpleStoreABI = JSON
.parse('[{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"set","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"storeValue","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_newValue","type":"uint256"},{"indexed":false,"name":"_sender","type":"address"}],"name":"SetComplete","type":"event"}]');

// bytecode
const SimpleStoreBytecode = '606060405234610000575b5b5b61010e8061001a6000396000f360606040526000357c01000000000000000000000000000000000000000000000000000000009004806360fe47b1146100435780636d4ce63c14610076575b610000565b346100005761005e6004808035906020019091905050610099565b60405180821515815260200191505060405180910390f35b3461000057610083610103565b6040518082815260200191505060405180910390f35b6000816000819055507f10e8e9bc5a1bde3dd6bb7245b52503fcb9d9b1d7c7b26743f82c51cc7cce917d60005433604051808381526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a1600190505b919050565b600060005490505b9056';

eth.accounts().then((accounts) => {
  const SimpleStore = contract(SimpleStoreABI, SimpleStoreBytecode, {
    from: accounts[0],
    gas: 300000,
  });

  // create a new contract
  SimpleStore.new((error, result) => {
    // result null '0x928sdfk...' (i.e. the transaction hash)
  });
});
```

### ContractFactory.at

[index.js:ethjs-contract](../../../blob/master/src/index.js "Source code on GitHub")

The contract factory has two methods, 'at' and 'new' which can be used to create the `Contract` instane.

**Parameters**

-   `address` **String** a single 20 byte alphanumeric hex string contract address

Result a single `Contract` **Object** instance.

```js
const HttpProvider = require('ethjs-provider-http');
const Eth = require('ethjs-query');
const EthContract = require('ethjs-contract');
const eth = new Eth(new HttpProvider('http://localhost:8545'));
const contract = new EthContract(eth);

// the abi
const SimpleStoreABI = JSON
.parse('[{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"set","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"storeValue","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_newValue","type":"uint256"},{"indexed":false,"name":"_sender","type":"address"}],"name":"SetComplete","type":"event"}]');

// bytecode
const SimpleStoreBytecode = '606060405234610000575b5b5b61010e8061001a6000396000f360606040526000357c01000000000000000000000000000000000000000000000000000000009004806360fe47b1146100435780636d4ce63c14610076575b610000565b346100005761005e6004808035906020019091905050610099565b60405180821515815260200191505060405180910390f35b3461000057610083610103565b6040518082815260200191505060405180910390f35b6000816000819055507f10e8e9bc5a1bde3dd6bb7245b52503fcb9d9b1d7c7b26743f82c51cc7cce917d60005433604051808381526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a1600190505b919050565b600060005490505b9056';

eth.accounts().then((accounts) => {
  const SimpleStore = contract(SimpleStoreABI, SimpleStoreBytecode, {
    from: accounts[0],
    gas: 300000,
  });

  // setup an instance of that contract
  const simpleStore = SimpleStore.at('0x000...');

  // use a method that comes with the contract
  simpleStore.set(45).then((txHash) => {
    console.log(txHash);
  });
});
```

### Contract

[index.js:ethjs-contract](../../../blob/master/src/index.js "Source code on GitHub")

The contract instance is meant to simulate a deployed Ethereum contract interface as a javascript object. All specified call methods are attached to this object (as specified by the contract ABI schema array).

In the example below, the SimpleStore contract has methods `set`, `get`, `constructor` and `SetComplete`.

The `get` method is flagged as `constant`, which means it will not make changes to the blockchain. It is purely for getting information from the chain.

However, the `set` method is not constant, which means it can be transacted with and change the blockchain.

The `constructor` method is only used when deploying the contract, i.e. when `.new` is used.

In this contract, the `SetComplete` event is fired when the `set` method has set a new value successfully.

You will notice the `simpleStore` instance makes all these methods available to it.

```js
const HttpProvider = require('ethjs-provider-http');
const Eth = require('ethjs-query');
const EthContract = require('ethjs-contract');
const eth = new Eth(new HttpProvider('http://localhost:8545'));
const contract = new EthContract(eth);

// the abi
const SimpleStoreABI = JSON
.parse('[{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"set","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"storeValue","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_newValue","type":"uint256"},{"indexed":false,"name":"_sender","type":"address"}],"name":"SetComplete","type":"event"}]');

// bytecode
const SimpleStoreBytecode = '606060405234610000575b5b5b61010e8061001a6000396000f360606040526000357c01000000000000000000000000000000000000000000000000000000009004806360fe47b1146100435780636d4ce63c14610076575b610000565b346100005761005e6004808035906020019091905050610099565b60405180821515815260200191505060405180910390f35b3461000057610083610103565b6040518082815260200191505060405180910390f35b6000816000819055507f10e8e9bc5a1bde3dd6bb7245b52503fcb9d9b1d7c7b26743f82c51cc7cce917d60005433604051808381526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a1600190505b919050565b600060005490505b9056';

eth.accounts().then((accounts) => {
  const SimpleStore = contract(SimpleStoreABI, SimpleStoreBytecode, {
    from: accounts[0],
    gas: 300000,
  });

  // setup an instance of that contract
  const simpleStore = SimpleStore.at('0x000...');

  simpleStore.set(45000, (error, result) => {
    // result null '0x2dfj24...'
  });

  simpleStore.get().catch((error) => {
    // error null
  }).then(result) => {
    // result <BigNumber ...>
  });

  const filter = simpleStore.SetComplete().new((error, result) => {
    // result null <BigNumber ...> filterId
  });
  filter.watch().then((result) => {
    // result null FilterResult {...} (will only fire once)
  });
  filter.uninstall((error, result) => {
    // result null Boolean filterUninstalled
  });
});
```

## Promises And callbacks

All `Contract` object prototype methods support both promises and callbacks. `EventFilter` objects also have complete promise support.

## Browser Builds

`ethjs` provides production distributions for all of its modules that are ready for use in the browser right away. Simply include either `dist/ethjs-contract.js` or `dist/ethjs-contract.min.js` directly into an HTML file to start using this module. Note, an `EthContract` object is made available globally.

```html
<script type="text/javascript" src="ethjs-contract.min.js"></script>
<script type="text/javascript">
new EthContract(...);
</script>
```

Note, even though `ethjs` should have transformed and polyfilled most of the requirements to run this module across most modern browsers. You may want to look at an additional polyfill for extra support.

Use a polyfill service such as `Polyfill.io` to ensure complete cross-browser support:
https://polyfill.io/

## Other Awesome Modules, Tools and Frameworks

 - [web3.js](https://github.com/ethereum/web3.js) -- the original Ethereum swiss army knife **Ethereum Foundation**
 - [ethereumjs](https://github.com/ethereumjs) -- critical ethereumjs infrastructure **Ethereum Foundation**
 - [browser-solidity](https://ethereum.github.io/browser-solidity) -- an in browser Solidity IDE **Ethereum Foundation**
 - [wafr](https://github.com/silentcicero/wafr) -- a super simple Solidity testing framework
 - [truffle](https://github.com/ConsenSys/truffle) -- a solidity/js dApp framework
 - [embark](https://github.com/iurimatias/embark-framework) -- a solidity/js dApp framework
 - [dapple](https://github.com/nexusdev/dapple) -- a solidity dApp framework
 - [chaitherium](https://github.com/SafeMarket/chaithereum) -- a JS web3 unit testing framework
 - [contest](https://github.com/DigixGlobal/contest) -- a JS testing framework for contracts

## Our Relationship with Ethereum & EthereumJS

 We would like to mention that we are not in any way affiliated with the Ethereum Foundation or `ethereumjs`. However, we love the work they do and work with them often to make Ethereum great! Our aim is to support the Ethereum ecosystem with a policy of diversity, modularity, simplicity, transparency, clarity, optimization and extensibility.

 Many of our modules use code from `web3.js` and the `ethereumjs-` repositories. We thank the authors where we can in the relevant repositories. We use their code carefully, and make sure all test coverage is ported over and where possible, expanded on.
