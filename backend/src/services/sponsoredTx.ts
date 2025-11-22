import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHEX } from '@mysten/sui/utils';
import type { AppConfig } from '../config.js';

/**
 * Service for handling sponsored (gasless) transactions on Sui
 *
 * The sponsor pays for gas, user doesn't need SUI tokens
 */
export class SponsoredTransactionService {
  private suiClient: SuiClient;
  private sponsorKeypair: Ed25519Keypair;
  private config: AppConfig;

  constructor(suiClient: SuiClient, config: AppConfig) {
    this.suiClient = suiClient;
    this.config = config;

    // Initialize sponsor keypair from private key
    if (config.sponsorPrivateKey) {
      const privateKeyBytes = fromHEX(config.sponsorPrivateKey);
      this.sponsorKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    } else {
      throw new Error('SPONSOR_PRIVATE_KEY not configured');
    }
  }

  /**
   * Execute a sponsored transaction
   * User signs the transaction, sponsor pays for gas
   */
  async executeSponsoredTransaction(
    tx: Transaction,
    userAddress: string
  ): Promise<{
    digest: string;
    effects: any;
  }> {
    try {
      // Set sender to user address
      tx.setSender(userAddress);

      // Set gas budget
      tx.setGasBudget(100_000_000); // 0.1 SUI

      // Build transaction bytes
      const txBytes = await tx.build({ client: this.suiClient });

      // Sponsor signs the transaction (pays for gas)
      const sponsorSignature = await this.sponsorKeypair.signTransaction(txBytes);

      // Execute sponsored transaction
      const result = await this.suiClient.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: [sponsorSignature.signature],
        options: {
          showEffects: true,
          showObjectChanges: true,
          showEvents: true,
        },
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(
          `Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`
        );
      }

      return {
        digest: result.digest,
        effects: result.effects,
      };
    } catch (error) {
      console.error('Sponsored transaction failed:', error);
      throw error;
    }
  }

  /**
   * Execute transaction fully sponsored (no user signature needed)
   * Sponsor both signs AND pays for the transaction
   *
   * Use this when user doesn't have a wallet (zkLogin flow)
   */
  async executeFullySponsoredTransaction(
    tx: Transaction
  ): Promise<{
    digest: string;
    effects: any;
    objectChanges?: any[];
    events?: any[];
  }> {
    try {
      // Set sender to sponsor (sponsor executes on behalf of user)
      const sponsorAddress = this.sponsorKeypair.getPublicKey().toSuiAddress();
      tx.setSender(sponsorAddress);

      // Set gas budget
      tx.setGasBudget(100_000_000); // 0.1 SUI

      // Sign and execute
      const result = await this.suiClient.signAndExecuteTransaction({
        transaction: tx,
        signer: this.sponsorKeypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showEvents: true,
        },
      });

      if (result.effects?.status?.status !== 'success') {
        throw new Error(
          `Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`
        );
      }

      return {
        digest: result.digest,
        effects: result.effects,
        objectChanges: result.objectChanges || undefined,
        events: result.events || undefined,
      };
    } catch (error) {
      console.error('Fully sponsored transaction failed:', error);
      throw error;
    }
  }

  /**
   * Get sponsor address
   */
  getSponsorAddress(): string {
    return this.sponsorKeypair.getPublicKey().toSuiAddress();
  }

  /**
   * Check sponsor balance
   */
  async getSponsorBalance(): Promise<bigint> {
    const sponsorAddress = this.getSponsorAddress();
    const balance = await this.suiClient.getBalance({
      owner: sponsorAddress,
    });
    return BigInt(balance.totalBalance);
  }
}

/**
 * Mock version for development (no blockchain)
 */
export class MockSponsoredTransactionService {
  async executeSponsoredTransaction(
    tx: Transaction,
    userAddress: string
  ): Promise<{ digest: string; effects: any }> {
    console.log('🔶 MOCK: Sponsored transaction for', userAddress);
    return {
      digest: '0xMOCK' + Math.random().toString(36).substring(2, 15),
      effects: { status: { status: 'success' } },
    };
  }

  async executeFullySponsoredTransaction(
    tx: Transaction
  ): Promise<{ digest: string; effects: any; objectChanges?: any[]; events?: any[] }> {
    console.log('🔶 MOCK: Fully sponsored transaction');
    return {
      digest: '0xMOCK' + Math.random().toString(36).substring(2, 15),
      effects: { status: { status: 'success' } },
      objectChanges: [],
      events: [],
    };
  }

  getSponsorAddress(): string {
    return '0xMOCKSPONSOR0000000000000000000000000000000000000000000000000000';
  }

  async getSponsorBalance(): Promise<bigint> {
    return BigInt(1000000000); // 1 SUI mock
  }
}
