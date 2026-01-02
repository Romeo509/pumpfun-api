import { Connection, VersionedTransaction, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fetch from "node-fetch";
import { RPC_ENDPOINT } from './config.js';

/* ================== CONFIG ================== */

/* ============================================ */

const connection = new Connection(RPC_ENDPOINT, "confirmed");

/**
 * Buys tokens on the Solana blockchain via Pump.fun
 * @param {Object} params - Buy parameters
 * @param {string} params.mintAddress - Token mint address to buy
 * @param {string} params.privateKey - Private key in base58 format
 * @param {number} params.amount - Amount in SOL to spend
 * @param {number} [params.slippage] - Slippage percentage (default: 10)
 * @param {number} [params.priorityFee] - Priority fee in SOL (default: 0.005)
 * @returns {Object} Result containing transaction signature and details
 */
export async function buyToken({ 
  mintAddress, 
  privateKey, 
  amount,
  slippage = 10,
  priorityFee = 0.005
}) {
  // Validate required parameters
  if (!mintAddress || !privateKey || amount === undefined || amount === null) {
    throw new Error("Mint address, private key, and amount are required");
  }

  try {
    /* 1️⃣ Request unsigned buy transaction */
    const response = await fetch("https://pumpportal.fun/api/trade-local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicKey: Keypair.fromSecretKey(bs58.decode(privateKey)).publicKey.toBase58(),
        action: "buy",
        mint: mintAddress,
        denominatedInSol: true,   // BOOLEAN
        amount: amount,   // SOL amount
        slippage: slippage,
        priorityFee: priorityFee,
        pool: "auto"
      })
    });

    if (!response.ok) {
      throw new Error(`PumpPortal error: ${response.statusText}`);
    }

    /* 2️⃣ Deserialize transaction */
    const txBuffer = await response.arrayBuffer();
    const transaction = VersionedTransaction.deserialize(
      new Uint8Array(txBuffer)
    );

    /* 3️⃣ Sign transaction */
    const signer = Keypair.fromSecretKey(bs58.decode(privateKey));
    transaction.sign([signer]);

    /* 4️⃣ Send transaction */
    const signature = await connection.sendTransaction(transaction, {
      skipPreflight: false
    });

    console.log("⏳ Buy sent:", signature);

    /* 5️⃣ Confirm */
    const confirmation = await connection.confirmTransaction(
      signature,
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error("Buy transaction failed");
    }

    console.log("✅ Buy successful");
    console.log(`🔗 https://solscan.io/tx/${signature}`);
    
    return {
      success: true,
      signature,
      transactionUrl: `https://solscan.io/tx/${signature}`,
      mintAddress,
      amountSpent: amount
    };

  } catch (err) {
    console.error("❌ Buy failed:", err.message);
    throw err;
  }
}

// For testing purposes
if (process.argv[1] === import.meta.url) {
  console.log("This module should be used with mint address, private key, and amount parameters");
}