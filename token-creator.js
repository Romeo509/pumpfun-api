import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs/promises";
import fetch from 'node-fetch';
import { fileFromPath } from 'formdata-node/file-from-path';
import { FormData, Blob } from 'formdata-node';
import { RPC_ENDPOINT } from './config.js';

/* ================== CONFIG ================== */

/* ============================================ */

/**
 * Creates a new token on the Solana blockchain via Pump.fun
 * @param {Object} params - Token creation parameters
 * @param {string} params.name - Token name
 * @param {string} params.symbol - Token symbol
 * @param {string} [params.description] - Token description
 * @param {string} [params.twitter] - Twitter URL
 * @param {string} [params.telegram] - Telegram URL
 * @param {string} [params.website] - Website URL
 * @param {string} params.image - Base64 encoded image string or path to image file
 * @param {string} params.privateKey - Private key in base58 format
 * @param {number} params.amount - Dev buy amount in SOL
 * @param {number} [params.priorityFee] - Priority fee in SOL (default: 0.005)
 * @returns {Object} Result containing transaction signature and token details
 */
export async function createToken({ 
  name, 
  symbol, 
  description = "This is an example token created via API", 
  twitter, 
  telegram, 
  website, 
  image,
  privateKey,
  amount,
  priorityFee = 0.005
}) {
  // Validate required parameters
  if (!name || !symbol || !privateKey || amount === undefined || amount === null) {
    throw new Error("Token name, symbol, private key, and amount are required");
  }

  const connection = new Connection(RPC_ENDPOINT, "confirmed");

  /* ---------- Wallets ---------- */
  const signerKeypair = Keypair.fromSecretKey(
    bs58.decode(privateKey)
  );

  // Mint keypair for the new token
  const mintKeypair = Keypair.generate();

  console.log("Creator:", signerKeypair.publicKey.toBase58());
  console.log("Mint:", mintKeypair.publicKey.toBase58());

  // Handle image - either as base64 string or file path
  let imageBuffer;
  if (image.startsWith('data:')) {
    // Handle base64 encoded image
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    imageBuffer = Buffer.from(base64Data, 'base64');
  } else if (image.startsWith('/') || image.startsWith('./') || image.startsWith('../')) {
    // Handle file path
    imageBuffer = await fs.readFile(image);
  } else {
    // Assume it's base64 without data prefix
    imageBuffer = Buffer.from(image, 'base64');
  }

  // Create temporary file for formdata-node
  const tempImagePath = './temp-token-image.jpeg';
  await fs.writeFile(tempImagePath, imageBuffer);
  
  try {
    const file = await fileFromPath(tempImagePath);
    
    const formData = new FormData();
    formData.append("file", file, "token-image.jpeg");
    formData.append("name", name);
    formData.append("symbol", symbol);
    formData.append("description", description);
    
    if (twitter) formData.append("twitter", twitter);
    if (telegram) formData.append("telegram", telegram);
    if (website) formData.append("website", website);
    
    formData.append("showName", "true");

    // Set up form data properly for Node.js
    const metadataRes = await fetch("https://pump.fun/api/ipfs", {
      method: "POST",
      body: formData,
    });
    
    if (!metadataRes.ok) {
      throw new Error(`IPFS upload failed: ${metadataRes.statusText}`);
    }

    const metadata = await metadataRes.json();

    /* ---------- Request unsigned create tx ---------- */
    const tradeRes = await fetch(
      "https://pumpportal.fun/api/trade-local",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: signerKeypair.publicKey.toBase58(),
          action: "create",
          tokenMetadata: {
            name: metadata.metadata.name,
            symbol: metadata.metadata.symbol,
            uri: metadata.metadataUri,
          },
          mint: mintKeypair.publicKey.toBase58(),
          denominatedInSol: true,
          amount: amount,               // dev buy amount
          slippage: 10,                // default slippage
          priorityFee: priorityFee,         // priority fee
          pool: "pump",                // default pool
          isMayhemMode: false,
        }),
      }
    );
    
    // Clean up temp file after successful request
    await fs.unlink(tempImagePath);
    
    if (!tradeRes.ok) {
      const errorText = await tradeRes.text();
      throw new Error(`Trade request failed: ${errorText}`);
    }

    /* ---------- Sign + send tx ---------- */
    const txBytes = new Uint8Array(await tradeRes.arrayBuffer());
    const tx = VersionedTransaction.deserialize(txBytes);

    // IMPORTANT: both must sign
    tx.sign([mintKeypair, signerKeypair]);

    const signature = await connection.sendTransaction(tx, {
      skipPreflight: true,
      maxRetries: 3,
    });

    console.log("✅ Token created");
    console.log("🔗 https://solscan.io/tx/" + signature);

    return {
      signature,
      mintAddress: mintKeypair.publicKey.toBase58(),
      creatorAddress: signerKeypair.publicKey.toBase58(),
      transactionUrl: `https://solscan.io/tx/${signature}`,
      metadataUri: metadata.metadataUri
    };
  } catch (error) {
    // Clean up temp file in case of error
    try {
      await fs.unlink(tempImagePath);
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError.message);
    }
    throw error; // Re-throw the original error
  }
}

// For testing purposes
if (process.argv[1] === import.meta.url) {
  console.log("This module should be used with a private key parameter");
}