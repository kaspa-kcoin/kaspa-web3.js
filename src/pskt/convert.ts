import { Transaction, TransactionInput, TransactionOutput, UtxoEntry } from '../tx';
import { Input, InputBuilder } from './input';
import { Output, OutputBuilder } from './output';
import { PSKT } from './pskt';
import { Global } from './global.ts';

/**
 * Convert Transaction to PSKT
 */
export function transactionToPSKT(tx: Transaction): PSKT {
  const inputs = tx.inputs.map((input) => inputFromTransactionInput(input));

  const outputs = tx.outputs.map((output) => outputFromTransactionOutput(output));

  return {
    state: {
      global: new Global(),
      inputs: inputs,
      outputs: outputs
    }
  } as PSKT;
}

/**
 * Convert TransactionInput to Input
 */
export function inputFromTransactionInput(input: TransactionInput): Input {
  const builder = new InputBuilder().setPreviousOutpoint(input.previousOutpoint).setSigOpCount(input.sigOpCount);

  // TODO: Add UtxoEntry to Input
  // if (input.utxo) {
  //   builder.setUtxoEntry(input.utxo);
  // } else {
  //   throw new Error('MissingUtxoEntry');
  // }

  return builder.build();
}

/**
 * Convert TransactionOutput to Output
 */
export function outputFromTransactionOutput(output: TransactionOutput): Output {
  const builder = new OutputBuilder().setAmount(output.value).setScriptPublicKey(output.scriptPublicKey);

  return builder.build();
}

/**
 * Convert Transaction with populated inputs to PSKT
 */
export function transactionWithInputsToInner(
  tx: Transaction,
  populatedInputs: Array<[TransactionInput, UtxoEntry]>
): PSKT {
  const inputs = populatedInputs.map(([input, utxo]) => {
    const builder = new InputBuilder()
      .setPreviousOutpoint(input.previousOutpoint)
      .setSigOpCount(input.sigOpCount)
      .setUtxoEntry(utxo);

    return builder.build();
  });

  const outputs = tx.outputs.map((output) => outputFromTransactionOutput(output));

  return {
    state: {
      global: new Global(),
      inputs,
      outputs: outputs
    }
  } as PSKT;
}
