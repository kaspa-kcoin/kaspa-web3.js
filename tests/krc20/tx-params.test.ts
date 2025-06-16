import { describe, it, expect } from 'vitest';
import { Address } from '../../src/address';
import { NetworkId } from '../../src/consensus';
import { Fees } from '../../src/tx';
import { Krc20DeployParams, Krc20MintParams, Krc20TransferParams } from '../../src/krc20/tx-params';

describe('Krc20TxParams', () => {
  const senderAddress = Address.fromString('kaspatest:qp3leh6s6t85put26yfy7c50ragzk266s700wtxvyrmjzznnlglg2qs70c3ls');
  const networkId = NetworkId.Testnet10;
  const priorityFee = Fees.from(1000n);

  describe('Krc20DeployParams', () => {
    it('should create a valid Krc20DeployParams instance', () => {
      const options = {
        tick: 'TEST',
        max: 1000n,
        lim: 100n,
        dec: 8,
        pre: 100n
      };
      const params = new Krc20DeployParams(senderAddress, networkId, priorityFee, options);
      expect(params).toBeInstanceOf(Krc20DeployParams);
      expect(params.options.tick).toBe('TEST');
    });

    it('should throw an error for invalid tick length', () => {
      const options = {
        tick: 'TOOLONGTICK',
        max: 1000n,
        lim: 100n
      };
      expect(() => new Krc20DeployParams(senderAddress, networkId, priorityFee, options)).toThrow('Invalid tick');
    });

    it('should throw an error if tick contains invalid characters', () => {
      const options = {
        tick: 'TEST!',
        max: 1000n,
        lim: 100n
      };
      expect(() => new Krc20DeployParams(senderAddress, networkId, priorityFee, options)).toThrow('Invalid tick');
      const options2 = {
        tick: 'TEST2',
        max: 1000n,
        lim: 100n
      };
      expect(() => new Krc20DeployParams(senderAddress, networkId, priorityFee, options2)).toThrow('Invalid tick');
    });

    it('should throw an error if max is less than lim', () => {
      const options = {
        tick: 'TEST',
        max: 100n,
        lim: 1000n
      };
      expect(() => new Krc20DeployParams(senderAddress, networkId, priorityFee, options)).toThrow(
        'max must be greater than or equal to lim'
      );
    });
  });

  describe('Krc20MintParams', () => {
    it('should create a valid Krc20MintParams instance', () => {
      const options = {
        tick: 'TEST',
        to: 'kaspatest:qrcln7p9ggre8wdmcvm85pqp083sqlrqwpayzrl4xwn4k42lcxlhx6e89pls9'
      };
      const params = new Krc20MintParams(senderAddress, networkId, priorityFee, options);
      expect(params).toBeInstanceOf(Krc20MintParams);
      expect(params.options.tick).toBe('TEST');
    });

    it('should throw an error for invalid address format', () => {
      const options = {
        tick: 'TEST',
        to: 'invalid-address'
      };
      expect(() => new Krc20MintParams(senderAddress, networkId, priorityFee, options)).toThrow(
        'Invalid address format'
      );
    });
  });

  describe('Krc20TransferParams', () => {
    it('should create a valid Krc20TransferParams instance', () => {
      const options = {
        tick: 'TEST',
        to: 'kaspatest:qp3leh6s6t85put26yfy7c50ragzk266s700wtxvyrmjzznnlglg2qs70c3ls',
        amount: 100n
      };
      const params = new Krc20TransferParams(senderAddress, networkId, priorityFee, options);
      expect(params).toBeInstanceOf(Krc20TransferParams);
      expect(params.options.tick).toBe('TEST');
    });

    it('should create a valid Krc20TransferParams instance with ca field', () => {
      const options = {
        ca: '1234567890123456789012345678901234567890123456789012345678901234', // 64 chars
        to: 'kaspatest:qp3leh6s6t85put26yfy7c50ragzk266s700wtxvyrmjzznnlglg2qs70c3ls',
        amount: 100n
      };
      const params = new Krc20TransferParams(senderAddress, networkId, priorityFee, options);
      expect(params).toBeInstanceOf(Krc20TransferParams);
      expect('ca' in params.options).toBeTruthy();
      expect((params.options as any).ca).toBe('1234567890123456789012345678901234567890123456789012345678901234');
    });

    it('should throw an error for amount less than or equal to zero', () => {
      const options = {
        tick: 'TEST',
        to: 'kaspatest:qp3leh6s6t85put26yfy7c50ragzk266s700wtxvyrmjzznnlglg2qs70c3ls',
        amount: 0n
      };
      expect(() => new Krc20TransferParams(senderAddress, networkId, priorityFee, options)).toThrow(
        'amount must be greater than 0'
      );
    });

    it('should throw an error for invalid address format', () => {
      const options = {
        tick: 'TEST',
        to: 'invalid-address',
        amount: 100n
      };
      expect(() => new Krc20TransferParams(senderAddress, networkId, priorityFee, options)).toThrow(
        'Invalid address format'
      );
    });

    it('should throw an error for ca with invalid length', () => {
      const options = {
        ca: '123456789012345678901234567890123456789012345678901234567890123', // 63 chars (too short)
        to: 'kaspatest:qp3leh6s6t85put26yfy7c50ragzk266s700wtxvyrmjzznnlglg2qs70c3ls',
        amount: 100n
      };
      expect(() => new Krc20TransferParams(senderAddress, networkId, priorityFee, options)).toThrow(
        'Invalid ca format'
      );

      const options2 = {
        ca: '12345678901234567890123456789012345678901234567890123456789012345', // 65 chars (too long)
        to: 'kaspatest:qp3leh6s6t85put26yfy7c50ragzk266s700wtxvyrmjzznnlglg2qs70c3ls',
        amount: 100n
      };
      expect(() => new Krc20TransferParams(senderAddress, networkId, priorityFee, options2)).toThrow(
        'Invalid ca format'
      );
    });

    it('should throw an error for ca with invalid characters', () => {
      const options = {
        ca: '12345678901234567890123456789012345678901234567890123456789012!', // contains special character
        to: 'kaspatest:qp3leh6s6t85put26yfy7c50ragzk266s700wtxvyrmjzznnlglg2qs70c3ls',
        amount: 100n
      };
      expect(() => new Krc20TransferParams(senderAddress, networkId, priorityFee, options)).toThrow(
        'Invalid ca format'
      );
    });
  });
});
