/**
 * Script to create an event and missions for LémanFlow
 * Run with: tsx scripts/create-event.ts
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { fromHEX } from '@mysten/sui/utils';

// Configuration
const PACKAGE_ID = '0xeaccd7e45223060773ec20ba54ab53a61fb81db577c8eebf800d6bbde95ea4ce';
const NETWORK = 'testnet';

// Your private key (from sui keytool export)
const PRIVATE_KEY_BECH32 = 'suiprivkey1qrxl9ddf8tx4d5nxpde6rt2xknazj7mrrawnpgx6ryhn4x5enjhh7szvpep';

async function main() {
  console.log('🚀 Creating LémanFlow Event...\n');

  // Initialize client
  const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });

  // Initialize keypair from bech32 private key
  const { secretKey } = decodeSuiPrivateKey(PRIVATE_KEY_BECH32);
  const keypair = Ed25519Keypair.fromSecretKey(secretKey);
  const address = keypair.getPublicKey().toSuiAddress();

  console.log(`📍 Using address: ${address}`);
  console.log(`📦 Package ID: ${PACKAGE_ID}\n`);

  // Create event
  console.log('📝 Step 1: Creating Event...');

  const tx = new Transaction();

  // Create event: create_event(name, description, start_time, end_time, ctx)
  tx.moveCall({
    target: `${PACKAGE_ID}::event::create_event`,
    arguments: [
      tx.pure.string('SUI Hackathon 2025'),
      tx.pure.string('Build the future of Web3 on Sui blockchain'),
      tx.pure.u64(Date.now()), // start_time
      tx.pure.u64(Date.now() + 30 * 24 * 60 * 60 * 1000), // end_time (30 days from now)
    ],
  });

  try {
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
    });

    console.log('✅ Event created!');
    console.log(`   Transaction: ${result.digest}`);

    // Wait for transaction to be indexed
    await client.waitForTransaction({ digest: result.digest });

    // Get created objects
    const txDetails = await client.getTransactionBlock({
      digest: result.digest,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    // Find the Event object and EventAdminCap
    const objectChanges = txDetails.objectChanges || [];
    const eventObject = objectChanges.find(
      (change) =>
        change.type === 'created' &&
        change.objectType?.includes('::event::Event')
    );
    const adminCap = objectChanges.find(
      (change) =>
        change.type === 'created' &&
        change.objectType?.includes('::event::EventAdminCap')
    );

    if (!eventObject || eventObject.type !== 'created') {
      throw new Error('Event object not found');
    }
    if (!adminCap || adminCap.type !== 'created') {
      throw new Error('AdminCap not found');
    }

    const eventId = eventObject.objectId;
    const adminCapId = adminCap.objectId;

    console.log(`   Event ID: ${eventId}`);
    console.log(`   Admin Cap ID: ${adminCapId}\n`);

    // Fund the event with SUI for rewards
    console.log('💰 Step 2: Funding Event Grant Pool...');

    const fundTx = new Transaction();
    const [coin] = fundTx.splitCoins(fundTx.gas, [fundTx.pure.u64(1_000_000_000)]); // 1 SUI

    fundTx.moveCall({
      target: `${PACKAGE_ID}::event::fund_event`,
      arguments: [
        fundTx.object(eventId),
        coin,
      ],
    });

    const fundResult = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: fundTx,
    });

    console.log('✅ Event funded with 1 SUI!');
    console.log(`   Transaction: ${fundResult.digest}\n`);

    await client.waitForTransaction({ digest: fundResult.digest });

    // Create missions
    console.log('🎯 Step 3: Creating Missions...\n');

    const missions = [
      {
        title: 'Check-in at Hackathon',
        description: 'Scan QR code at the entrance to check-in',
        reward: 100_000_000, // 0.1 SUI
      },
      {
        title: 'Attend Workshop',
        description: 'Participate in the Move smart contracts workshop',
        reward: 200_000_000, // 0.2 SUI
      },
      {
        title: 'Submit Project',
        description: 'Submit your hackathon project on DevFolio',
        reward: 500_000_000, // 0.5 SUI
      },
    ];

    for (const mission of missions) {
      const missionTx = new Transaction();

      // Create mission: create_mission(admin_cap, event, title, description, reward_amount, qr_secret_hash, ctx)
      // For demo, we'll use a simple QR secret hash
      const qrSecret = `mission-${mission.title.toLowerCase().replace(/\s+/g, '-')}-secret`;
      const qrSecretHash = Array.from(new TextEncoder().encode(qrSecret));

      missionTx.moveCall({
        target: `${PACKAGE_ID}::mission::create_mission`,
        arguments: [
          missionTx.object(adminCapId),
          missionTx.object(eventId),
          missionTx.pure.vector('u8', Array.from(new TextEncoder().encode(mission.title))),
          missionTx.pure.vector('u8', Array.from(new TextEncoder().encode(mission.description))),
          missionTx.pure.u64(mission.reward),
          missionTx.pure.vector('u8', qrSecretHash),
        ],
      });

      const missionResult = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: missionTx,
      });

      console.log(`✅ Created: "${mission.title}"`);
      console.log(`   Reward: ${mission.reward / 1_000_000_000} SUI`);
      console.log(`   Transaction: ${missionResult.digest}`);

      await client.waitForTransaction({ digest: missionResult.digest });
    }

    console.log('\n🎉 Setup Complete!\n');
    console.log('📋 Summary:');
    console.log(`   Event ID: ${eventId}`);
    console.log(`   Admin Cap ID: ${adminCapId}`);
    console.log(`   Missions Created: ${missions.length}`);
    console.log(`   Grant Pool: 1 SUI`);
    console.log('\n💡 Next Steps:');
    console.log(`   1. Update your frontend to use Event ID: ${eventId}`);
    console.log(`   2. Update backend .env with EVENT_ID=${eventId}`);
    console.log('   3. Restart backend and frontend');
    console.log('   4. Connect wallet and claim missions!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

main();
