const EthContract = require('../index.js');
const Eth = require('ethjs-query');
const TestRPC = require('ethereumjs-testrpc');
const provider = TestRPC.provider();
const assert = require('chai').assert;

describe('EthContract', () => {
  describe('should function normally', () => {
    it('should construct properly', (done) => {
      const eth = new Eth(provider);
      const contract = new EthContract(eth);

      const SimpleStoreABI = [{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"set","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"get","outputs":[{"name":"storeValue","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_newValue","type":"uint256"},{"indexed":false,"name":"_sender","type":"address"}],"name":"SetComplete","type":"event"}]; // eslint-disable-line
      const SimpleStoreBytecode = '606060405234610000575b61010e806100186000396000f360606040526000357c01000000000000000000000000000000000000000000000000000000009004806360fe47b1146100435780636d4ce63c14610076575b610000565b346100005761005e6004808035906020019091905050610099565b60405180821515815260200191505060405180910390f35b3461000057610083610103565b6040518082815260200191505060405180910390f35b6000816000819055507f10e8e9bc5a1bde3dd6bb7245b52503fcb9d9b1d7c7b26743f82c51cc7cce917d60005433604051808381526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a1600190505b919050565b600060005490505b9056';

      eth.accounts((accountsError, accounts) => {
        assert.equal(accountsError, null);

        const SimpleStore = contract(SimpleStoreABI, SimpleStoreBytecode, {
          from: accounts[0],
          gas: 300000,
        });
        // const simpleStore = SimpleStore.at('0xca35b7d915458ef540ade6068dfe2f44e8fa733c');

        SimpleStore.new((newError, newResult) => {
          assert.equal(newError, null);

          setTimeout(() => {
            eth.getTransactionReceipt(newResult, (errorReceipt, receipt) => {
              assert.equal(errorReceipt, null);
              const simpleStore = SimpleStore.at(receipt.contractAddress);

              simpleStore.set(4500, (setError, setResult) => {
                assert.equal(setError, null);
                assert.equal(typeof setResult, 'string');
                done();
              });
            });
          }, 1500);
        });
      });
    });
  });
});
