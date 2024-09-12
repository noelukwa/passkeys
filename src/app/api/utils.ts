/////////////////////////////////////////////////
///     REPLACE WITH AN ACTUAL DATABASE (🥲)////
////////////////////////////////////////////////

import * as fs from "fs/promises";
import * as path from "path";

export interface User {
  id: string;
  username: string;
  devices: Array<{
    credentialPublicKey: ArrayBuffer;
    credentialID: string;
    counter: number;
  }>;
  currentChallenge?: string;
}

export const rpName = "Passkey Demo";
///////////////////////////////////////////////////////////////////
///   MAY NOT WORK AS EXPECTED WITH HTTP ON LOCALHOST            ///
///   (self plug) to get a working .local domain with https,     ///
///   see: https://github.com/noelukwa/localbase                 ///
////////////////////////////////////////////////////////////////////
export const rpID = "passby.local";
export const origin = `https://${rpID}`;

const USER_FILE_PATH = path.resolve("users.json");

export async function readUsers(): Promise<Map<string, User>> {
  try {
    const data = await fs.readFile(USER_FILE_PATH, "utf-8");
    if (!data.trim()) {
      return new Map();
    }
    const usersArray: User[] = JSON.parse(data, (key, value) => {
      if (key === "credentialPublicKey") {
        return new Uint8Array(Object.values(value)).buffer;
      }
      return value;
    });
    return new Map(usersArray.map((user) => [user.username, user]));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Map();
    }

    console.error("Error reading users file:", error);
    return new Map();
  }
}

export async function writeUsers(users: Map<string, User>): Promise<void> {
  const usersArray = Array.from(users.values());
  const data = JSON.stringify(
    usersArray,
    (key, value) => {
      if (value instanceof ArrayBuffer) {
        return Array.from(new Uint8Array(value));
      }
      return value;
    },
    2,
  );
  await fs.writeFile(USER_FILE_PATH, data, "utf-8");
}

export async function getUser(userId: string): Promise<User | undefined> {
  const users = await readUsers();
  return users.get(userId);
}

export async function saveUser(user: User): Promise<void> {
  const users = await readUsers();
  users.set(user.username, user);
  await writeUsers(users);
}

export async function updateUser(
  username: string,
  updateData: Partial<User>,
): Promise<User | undefined> {
  const users = await readUsers();
  const user = users.get(username);
  if (user) {
    const updatedUser = { ...user, ...updateData };
    users.set(username, updatedUser);
    await writeUsers(users);
    return updatedUser;
  }
  return undefined;
}

export function encodeBase64URL(buffer: ArrayBuffer): string {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function decodeBase64URL(base64URLString: string): ArrayBuffer {
  const base64 = base64URLString.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}

export const textEncoder = new TextEncoder();
