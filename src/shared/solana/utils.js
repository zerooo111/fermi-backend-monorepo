import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { SOLANA_CONFIG } from "./config";
import { IDL } from "./idl";

export async function getFermiProgram(customWallet) {
  try {
    const conn = new Connection(SOLANA_CONFIG.RPC_URL);
    // Verify connection 
    const version = await conn.getVersion();
    if (!version) {
      throw new Error("Failed to verify Solana connection");
    }

    const provider = new AnchorProvider(conn, customWallet ?? new Wallet(new Keypair()), {
      commitment: "confirmed",
    });

    return new Program(IDL, SOLANA_CONFIG.PROGRAM_ID, provider);
  } catch (error) {
    throw new Error(`Failed to get Fermi program: ${error.message}`);
  }
}

