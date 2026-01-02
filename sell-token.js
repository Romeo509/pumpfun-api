import { Connection, VersionedTransaction, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fetch from "node-fetch";
import { RPC_ENDPOINT } from './config.js';

/* ================== CONFIG ================== */

/* ============================================ */

const connection = new Connection(RPC_ENDPOINT, "confirmed");

/**
 * Performs a token sell operation on Pump.fun
 * @param {Object} params - Function parameters
 * @param {string} params.mintAddress - Token mint address to sell
 * @param {string} params.privateKey - Private key in base58 format
 * @param {number|string} params.amount - Amount of tokens to sell (number) or percentage string (e.g. "100%")
 * @param {number} [params.slippage] - Slippage percentage (default: 10)
 * @param {number} [params.priorityFee] - Priority fee in SOL (default: 0.005)
 * @returns {Object} Result containing transaction signature and details
 */
export async function sellToken({ 
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
    /* 1️⃣ Request unsigned sell transaction */
    const response = await fetch("https://pumpportal.fun/api/trade-local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicKey: Keypair.fromSecretKey(bs58.decode(privateKey)).publicKey.toBase58(),
        action: "sell",  // Changed from "buy" to "sell"
        mint: mintAddress,
        denominatedInSol: false,   // Changed to false for sell action
        amount: amount,        // Amount of tokens to sell
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

    console.log("✅ Sell transaction sent:", signature);

    /* 5️⃣ Confirm */
    const confirmation = await connection.confirmTransaction(
      signature,
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error("Sell transaction failed");
    }

    console.log("✅ Sell transaction confirmed");
    console.log("🔗 https://solscan.io/tx/" + signature);
    
    return {
      success: true,
      signature,
      transactionUrl: `https://solscan.io/tx/${signature}`,
      mintAddress,
      amountSold: amount,
      slippage,
      priorityFee
    };
  } catch (err) {
    console.error("❌ Sell transaction failed:", err.message);
    throw err;
  }
}