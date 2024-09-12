import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import {
  rpName,
  rpID,
  User,
  textEncoder,
  encodeBase64URL,
  saveUser,
  getUser,
} from "../utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username } = body as { username: string };

    const existing = await getUser(username);
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    const user: User = {
      id: encodeBase64URL(textEncoder.encode(username)),
      username,
      devices: [],
    };

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: textEncoder.encode(user.id),
      userName: username,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "preferred",
      },
    });

    user.currentChallenge = options.challenge;
    await saveUser(user);

    return NextResponse.json(options);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process registration request" },
      { status: 500 },
    );
  }
}
