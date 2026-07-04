import {
  rpc,
  Contract,
  Keypair,
  TransactionBuilder,
  Networks,
  Address,
  xdr,
  nativeToScVal,
  scValToNative,
  Account,
} from 'stellar-sdk';

export interface StreamState {
  id: number;
  sender: string;
  recipient: string;
  token: string;
  totalAmount: string;
  withdrawnAmount: string;
  startTime: number;
  stopTime: number;
  active: boolean;
}

export class VectorFlowClient {
  private rpcServer: rpc.Server;
  private networkPassphrase: string;
  private contractId: string;
  private keypair?: Keypair;

  constructor(rpcUrl: string, networkPassphrase: string, contractId: string, secretKey?: string) {
    this.rpcServer = new rpc.Server(rpcUrl);
    this.networkPassphrase = networkPassphrase;
    this.contractId = contractId;
    if (secretKey) {
      this.keypair = Keypair.fromSecret(secretKey);
    }
  }

  private getContract(): Contract {
    return new Contract(this.contractId);
  }

  /**
   * Invokes a read-only method on the contract.
   */
  private async queryContract(method: string, args: xdr.ScVal[] = []): Promise<xdr.ScVal> {
    const contract = this.getContract();
    const mockTx = new TransactionBuilder(
      new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '1'),
      { fee: '100', networkPassphrase: this.networkPassphrase }
    )
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const sim = await this.rpcServer.simulateTransaction(mockTx);
    if (rpc.Api.isSimulationSuccess(sim)) {
      return sim.result!.retval;
    }
    throw new Error(`Simulation failed for ${method}`);
  }

  /**
   * Fetch stream metadata from contract.
   */
  public async getStream(streamId: number): Promise<StreamState> {
    const res = await this.queryContract('get_stream', [nativeToScVal(streamId, { type: 'u64' })]);
    const val = scValToNative(res);
    return {
      id: Number(val.id),
      sender: val.sender,
      recipient: val.recipient,
      token: val.token,
      totalAmount: val.total_amount.toString(),
      withdrawnAmount: val.withdrawn_amount.toString(),
      startTime: Number(val.start_time),
      stopTime: Number(val.stop_time),
      active: val.active,
    };
  }

  /**
   * Fetch the current claimable balance.
   */
  public async getClaimableAmount(streamId: number): Promise<string> {
    const res = await this.queryContract('get_claimable_amount', [
      nativeToScVal(streamId, { type: 'u64' }),
    ]);
    return scValToNative(res).toString();
  }
}
