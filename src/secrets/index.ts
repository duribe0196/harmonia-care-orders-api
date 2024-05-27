import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

interface GetSecretsParams {
  secretName: string;
  region: string;
}

export async function getSecrets(args: GetSecretsParams) {
  try {
    console.log(`getSecrets: Obtaining secrets from ${args.secretName}`);
    const client = new SecretsManagerClient({ region: args.region });
    const command = new GetSecretValueCommand({ SecretId: args.secretName });
    const response = await client.send(command);
    const secretString = response.SecretString;
    return JSON.parse(secretString ?? "{}");
  } catch (error) {
    console.error("getSecrets - Error retrieving secrets:", error);
    throw error;
  }
}
