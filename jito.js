import { Connection, VersionedTransaction, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fetch from "node-fetch";
import { RPC_ENDPOINT } from './config.js';

/* ================== CONFIG ================== */

/* ============================================ */

const connection = new Connection(RPC_ENDPOINT, "confirmed");

/**
 * Performs sequential token purchases for an array of buy requests
 * @param {Array} buyRequests - Array of buy request objects
 * @param {string} buyRequests[].mintAddress - Token mint address to buy
 * @param {string} buyRequests[].privateKey - Private key in base58 format
 * @param {number} buyRequests[].amount - Amount in SOL to spend
 * @param {number} [buyRequests[].slippage] - Slippage percentage (default: 10)
 * @param {number} [buyRequests[].priorityFee] - Priority fee in SOL (default: 0.005)
 * @returns {Array} Array of results for each transaction
 */
export async function sequentialBuyTokens(buyRequests) {
  // Validate input
  if (!Array.isArray(buyRequests) || buyRequests.length === 0) {
    throw new Error("Buy requests must be a non-empty array");
  }

  const results = [];

  for (let i = 0; i < buyRequests.length; i++) {
    const request = buyRequests[i];
    
    // Validate required parameters for each request
    if (!request.mintAddress || !request.privateKey || request.amount === undefined || request.amount === null) {
      const errorResult = {
        index: i,
        success: false,
        error: "Mint address, private key, and amount are required for each request",
        request: { mintAddress: request.mintAddress, amount: request.amount }
      };
      results.push(errorResult);
      continue; // Continue with next request
    }

    try {
      const slippage = request.slippage || 10;
      
      /* 1️⃣ Request unsigned buy transaction */
      const response = await fetch("https://pumpportal.fun/api/trade-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: Keypair.fromSecretKey(bs58.decode(request.privateKey)).publicKey.toBase58(),
          action: "buy",
          mint: request.mintAddress,
          denominatedInSol: true,   // BOOLEAN
          amount: request.amount,   // SOL amount
          slippage: slippage,
          priorityFee: request.priorityFee || 0.005,
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
      const signer = Keypair.fromSecretKey(bs58.decode(request.privateKey));
      transaction.sign([signer]);

      /* 4️⃣ Send transaction */
      const signature = await connection.sendTransaction(transaction, {
        skipPreflight: false
      });

      console.log(`⏳ Buy ${i+1}/${buyRequests.length} sent:`, signature);

      /* 5️⃣ Confirm */
      const confirmation = await connection.confirmTransaction(
        signature,
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error("Buy transaction failed");
      }

      console.log(`✅ Buy ${i+1}/${buyRequests.length} successful`);
      console.log(`🔗 https://solscan.io/tx/${signature}`);
      
      const successResult = {
        index: i,
        success: true,
        signature,
        transactionUrl: `https://solscan.io/tx/${signature}`,
        mintAddress: request.mintAddress,
        amountSpent: request.amount,
        slippage: slippage
      };
      
      results.push(successResult);
      
    } catch (err) {
      console.error(`❌ Buy ${i+1}/${buyRequests.length} failed:`, err.message);
      
      const errorResult = {
        index: i,
        success: false,
        error: err.message,
        mintAddress: request.mintAddress,
        amount: request.amount
      };
      
      results.push(errorResult);
    }
  }

  return results;
}

// For testing purposes
if (process.argv[1] === import.meta.url) {
  console.log("This module should be used with an array of buy requests");
}