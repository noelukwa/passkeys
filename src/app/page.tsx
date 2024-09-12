"use client";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types";
import React, { ChangeEvent } from "react";

export default function Home() {
  const [username, setUsername] = React.useState("");
  const [message, setMessage] = React.useState("");

  const handleRegister = async () => {
    try {
      const optionsResponse = await fetch(`/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const options: PublicKeyCredentialCreationOptionsJSON =
        await optionsResponse.json();

      const attResp = await startRegistration(options);

      const verificationResponse = await fetch(`/api/register/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          attestationResponse: attResp,
        }),
      });

      const verificationResult = await verificationResponse.json();

      if (verificationResult.verified) {
        setMessage("Registration successful!");
      } else {
        setMessage("Registration failed.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Registration failed.");
    }
  };

  const handleLogin = async () => {
    try {
      const optionsResponse = await fetch(`/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const options: PublicKeyCredentialRequestOptionsJSON =
        await optionsResponse.json();

      const asseResp = await startAuthentication(options);

      const verificationResponse = await fetch(`/api/login/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          assertionResponse: asseResp,
        }),
      });

      const verificationResult = await verificationResponse.json();

      if (verificationResult.verified) {
        setMessage("Login successful!");
      } else {
        setMessage("Login failed.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Login failed.");
    }
  };

  return (
    <div>
      <h1>Passkey Authentication Demo</h1>
      <input
        type="text"
        value={username}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setUsername(e.target.value)
        }
        placeholder="Username"
      />
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleLogin}>Login</button>
      {message && <p>{message}</p>}
    </div>
  );
}
