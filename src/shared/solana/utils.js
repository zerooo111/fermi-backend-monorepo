import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Keypair, Connection } from "@solana/web3.js";
import { SOLANA_CONFIG } from "./config.js";
import { IDL } from "./idl.js";

export function getFermiProgram(customWallet) {
  const conn = new Connection(SOLANA_CONFIG.RPC_URL);
  const wallet = customWallet ?? new Wallet(new Keypair());
  const provider = new AnchorProvider(conn, wallet, {
    commitment: "confirmed",
  });
  return new Program(IDL, SOLANA_CONFIG.PROGRAM_ID, provider);
}
