import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs/promises";

/* ================== CONFIG ================== */

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
// Better: Helius / QuickNode / Alchemy

// Base58 PRIVATE KEY (NOT public key, NOT JSON array)
const PRIVATE_KEY_BASE58 = "your private key";

/* ============================================ */

const connection = new Connection(RPC_ENDPOINT, "confirmed");

async function sendLocalCreateTx() {
    /* ---------- Wallets ---------- */
    const signerKeypair = Keypair.fromSecretKey(
        bs58.decode(PRIVATE_KEY_BASE58)
    );

    // Mint keypair for the new token
    const mintKeypair = Keypair.generate();

    console.log("Creator:", signerKeypair.publicKey.toBase58());
    console.log("Mint:", mintKeypair.publicKey.toBase58());

    /* ---------- Upload metadata to IPFS ---------- */
    const imageBuffer = await fs.readFile("./example.jpeg");
    const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("file", imageBlob, "example.jpeg");
    formData.append("name", "runTest");
    formData.append("symbol", "runT");
    formData.append(
        "description",
        "This is an example token created via PumpPortal.fun"
    );
    formData.append("twitter", "https://x.com/a1lon9");
    formData.append("telegram", "https://t.me/example");
    formData.append("website", "https://pumpportal.fun");
    formData.append("showName", "true");

    const metadataRes = await fetch("https://pump.fun/api/ipfs", {
        method: "POST",
        body: formData,
    });

    if (!metadataRes.ok) {
        throw new Error("IPFS upload failed");
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
                amount: 0.040,               // dev buy (1 SOL)
                slippage: 10,
                priorityFee: 0.0005,
                pool: "pump",
                isMayhemMode: false,
            }),
        }
    );

    if (!tradeRes.ok) {
        throw new Error(await tradeRes.text());
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
}

sendLocalCreateTx().catch(console.error);
