import { describe, it, expect } from 'vitest';
import { Address, AddressPrefix, AddressVersion } from '../src/address';

describe('Address Tests', () => {
  const addressCases = [
    {
      address: new Address(AddressPrefix.A, AddressVersion.PubKey, new Uint8Array([])),
      expected: 'a:qqeq69uvrh'
    },
    {
      address: new Address(AddressPrefix.A, AddressVersion.ScriptHash, new Uint8Array([])),
      expected: 'a:pq99546ray'
    },
    {
      address: new Address(AddressPrefix.B, AddressVersion.ScriptHash, new Uint8Array([32])),
      expected: 'b:pqsqzsjd64fv'
    },
    {
      address: new Address(AddressPrefix.B, AddressVersion.ScriptHash, new Uint8Array([45])),
      expected: 'b:pqksmhczf8ud'
    },
    {
      address: new Address(AddressPrefix.B, AddressVersion.ScriptHash, new Uint8Array([48])),
      expected: 'b:pqcq53eqrk0e'
    },
    {
      address: new Address(AddressPrefix.B, AddressVersion.ScriptHash, new Uint8Array([49])),
      expected: 'b:pqcshg75y0vf'
    },
    {
      address: new Address(AddressPrefix.B, AddressVersion.ScriptHash, new Uint8Array([45, 49])),
      expected: 'b:pqknzl4e9y0zy'
    },
    {
      address: new Address(AddressPrefix.B, AddressVersion.ScriptHash, new Uint8Array([49, 49])),
      expected: 'b:pqcnzt888ytdg'
    },
    {
      address: new Address(AddressPrefix.B, AddressVersion.ScriptHash, new Uint8Array([97, 98, 99])),
      expected: 'b:ppskycc8txxxn2w'
    },
    {
      address: new Address(
        AddressPrefix.B,
        AddressVersion.ScriptHash,
        new Uint8Array([49, 50, 51, 52, 53, 57, 56, 55, 54, 48])
      ),
      expected: 'b:pqcnyve5x5unsdekxqeusxeyu2'
    },
    {
      address: new Address(
        AddressPrefix.B,
        AddressVersion.ScriptHash,
        new Uint8Array([
          97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118,
          119, 120, 121, 122
        ])
      ),
      expected: 'b:ppskycmyv4nxw6rfdf4kcmtwdac8zunnw36hvamc09aqtpppz8lk'
    },
    {
      address: new Address(AddressPrefix.B, AddressVersion.ScriptHash, new Uint8Array(42).fill(48)),
      expected: 'b:pqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrqvpsxqcrq7ag684l3'
    },
    {
      address: new Address(AddressPrefix.Testnet, AddressVersion.PubKey, new Uint8Array(32)),
      expected: 'kaspatest:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhqrxplya'
    },
    {
      address: new Address(AddressPrefix.Testnet, AddressVersion.PubKeyECDSA, new Uint8Array(33)),
      expected: 'kaspatest:qyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhe837j2d'
    },
    {
      address: new Address(
        AddressPrefix.Testnet,
        AddressVersion.PubKeyECDSA,
        new Uint8Array([
          186, 1, 252, 95, 78, 157, 152, 121, 89, 156, 105, 163, 218, 253, 184, 53, 167, 37, 94, 95, 46, 147, 78, 147,
          34, 236, 211, 175, 25, 10, 176, 246, 14
        ])
      ),
      expected: 'kaspatest:qxaqrlzlf6wes72en3568khahq66wf27tuhfxn5nytkd8tcep2c0vrse6gdmpks'
    },
    {
      address: new Address(AddressPrefix.Mainnet, AddressVersion.PubKey, new Uint8Array(32)),
      expected: 'kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e'
    },
    {
      address: new Address(
        AddressPrefix.Mainnet,
        AddressVersion.PubKey,
        new Uint8Array([
          95, 255, 60, 77, 161, 143, 69, 173, 205, 212, 153, 228, 70, 17, 233, 255, 241, 72, 186, 105, 219, 60, 78, 162,
          221, 217, 85, 252, 70, 165, 149, 34
        ])
      ),
      expected: 'kaspa:qp0l70zd5x85ttwd6jv7g3s3a8llzj96d8dncn4zmhv4tlzx5k2jyqh70xmfj'
    }
  ];

  addressCases.forEach(({ address, expected }) => {
    it(`should convert address to string: ${expected}`, () => {
      const addressStr = address.toString();
      expect(addressStr).toBe(expected);
    });

    it(`should parse address from string: ${expected}`, () => {
      const parsedAddress = Address.fromString(expected);
      expect(parsedAddress.toString()).toBe(expected);
    });
  });

  it('should throw errors for invalid addresses', () => {
    expect(() => Address.fromString('kaspa:qqqqqqqqqqqqq1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e')).toThrow(
      Error
    );
    expect(() => Address.fromString('kaspa:qqqqqqqqqqqqq|qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e')).toThrow(
      Error
    );
    expect(() => Address.fromString('kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4l')).toThrow(
      Error
    );
    expect(() => Address.fromString('kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e')).toThrow(
      Error
    );
  });
});
