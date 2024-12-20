import { Buffer } from 'buffer';

class Blake2bHashKey {
  static readonly TransactionHash = Buffer.from('TransactionHash');
  static readonly TransactionID = Buffer.from('TransactionID');
  static readonly TransactionSigning = Buffer.from('TransactionSigningHash');
  static readonly Block = Buffer.from('BlockHash');
  static readonly ProofOfWork = Buffer.from('ProofOfWorkHash');
  static readonly MerkleBranch = Buffer.from('MerkleBranchHash');
  static readonly MuHashElement = Buffer.from('MuHashElement');
  static readonly MuHashFinalize = Buffer.from('MuHashFinalize');
  static readonly PersonalMessageSigning = Buffer.from('PersonalMessageSigningHash');
}

class Sha256HashKey {
  static readonly TransactionSigningHashECDSA = Buffer.from('TransactionSigningHashECDSA');
}

export { Blake2bHashKey, Sha256HashKey };
