import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getUser, rpID } from "../utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username } = body as { username: string };

    const user = await getUser(username);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.devices.map((device) => ({
        id: device.credentialID,
        type: "public-key" as const,
      })),
      userVerification: "preferred",
    });

    user.currentChallenge = options.challenge;

    return NextResponse.json(options);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process login request" },
      { status: 500 },
    );
  }
}
