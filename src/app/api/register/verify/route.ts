import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { RegistrationResponseJSON } from "@simplewebauthn/types";
import {
  rpID,
  origin,
  textEncoder,
  encodeBase64URL,
  getUser,
  updateUser,
} from "../../utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, attestationResponse } = body as {
      username: string;
      attestationResponse: RegistrationResponseJSON;
    };

    const user = await getUser(username);
    if (!user) {
      console.log("not found");
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const expectedChallenge = user.currentChallenge;
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: "No challenge found for user" },
        { status: 400 },
      );
    }

    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credentialPublicKey, credentialID } = registrationInfo;

      const existingDevice = user.devices.find(
        (device) =>
          device.credentialID ===
          encodeBase64URL(textEncoder.encode(credentialID).buffer),
      );

      if (!existingDevice) {
        const newDevice = {
          credentialPublicKey,
          credentialID: encodeBase64URL(
            textEncoder.encode(credentialID).buffer,
          ),
          counter: 0,
        };

        console.log(`newDevice: ${newDevice}`);

        await updateUser(user.username, {
          devices: [...user.devices, newDevice],
        });
      }
    }

    return NextResponse.json({ verified });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to verify registration" },
      { status: 400 },
    );
  }
}
