import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { rpID, origin, getUser } from "../../utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, assertionResponse } = body as {
      username: string;
      assertionResponse: AuthenticationResponseJSON;
    };

    const user = await getUser(username);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const expectedChallenge = user.currentChallenge;
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: "No challenge found for user" },
        { status: 400 },
      );
    }

    const device = user.devices.find(
      (device) => device.credentialID === assertionResponse.id,
    );

    if (!device) {
      return NextResponse.json(
        { error: "Authenticator is not registered with this site" },
        { status: 400 },
      );
    }

    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: new Uint8Array(device.credentialPublicKey),
        credentialID: device.credentialID,
        counter: device.counter,
      },
    });

    const { verified, authenticationInfo } = verification;

    if (verified && authenticationInfo) {
      device.counter = authenticationInfo.newCounter;
    }

    return NextResponse.json({ verified });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to verify authentication" },
      { status: 400 },
    );
  }
}
