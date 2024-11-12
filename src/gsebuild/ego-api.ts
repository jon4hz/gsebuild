// Copyright Sebastian Wiesner <sebastian@swsnr.de>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * The extensions.gnome.org API.
 *
 * @see https://extensions.gnome.org/api/docs/
 * @module
 */

/**
 * An error returned by the API.
 */
class APIStatusError extends Error {
  constructor(
    /**
     * The status code returned in response to the API request.
     */
    readonly status: number,
    /**
     * The detail string returned in the response body.
     */
    readonly detail: APIDetailResponse,
    options?: ErrorOptions,
  ) {
    super(
      `API request failed with status ${status.toFixed(0)}: ${detail.detail ?? "n/a"}`,
      options,
    );
  }
}

/**
 * Read data from an API response.
 *
 * This function does not validate the shape of response data.
 *
 * @param response The response to read data from
 * @tparam T The type of response data
 * @throws APIStatusError If `response` does not have an OK status code
 * @returns The body of `response`, decoded from JSON and cast to `T`
 */
const readAPIResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok) {
    throw new APIStatusError(response.status, data as APIDetailResponse);
  } else {
    return data as T;
  }
};

/** User authentication for EGO. */
export interface UserAuthentication {
  readonly username: string;
  readonly password: string;
}

interface APIDetailResponse {
  readonly detail?: string;
}

interface APIToken {
  readonly token: string;
}

interface APITokenResponse extends APIDetailResponse {
  readonly token: APIToken;
}

/**
 * Login with the given authentication data.
 *
 * @param auth The authentication to use
 * @return The authentication token to use for further API requests
 */
export const login = async (auth: UserAuthentication): Promise<string> => {
  const response = await fetch(
    "https://extensions.gnome.org/api/v1/accounts/login/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        login: auth.username,
        password: auth.password,
      }),
    },
  );

  try {
    return (await readAPIResponse<APITokenResponse>(response)).token.token;
  } catch (cause) {
    throw new Error("Login failed", { cause });
  }
};

const authorizationHeader = (token: string): Record<string, string> => ({
  Authorization: `Token ${token}`,
});

/**
 * Log out and invalidate the given API `token`.
 *
 * @param token The token to invalidate
 */
export const logout = async (token: string): Promise<void> => {
  const response = await fetch(
    "https://extensions.gnome.org/api/v1/accounts/logout/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authorizationHeader(token),
      },
      body: JSON.stringify({
        revoke_token: true,
      }),
    },
  );
  try {
    await readAPIResponse<unknown>(response);
  } catch (cause) {
    throw new Error("Logout failed", { cause });
  }
};

/**
 * A failed upload.
 */
export class InvalidUploadError extends Error {
  constructor(readonly errors: readonly string[]) {
    super(errors[0]);
  }
}

/**
 * An uploaded extension.
 */
export interface UploadedExtension {
  /**
   * The extension UUID.
   */
  readonly extension: string;

  /**
   * The new version assigned by extensions.gnome.org.
   */
  readonly version: number;
}

/**
 * Prompts the user has to confirm in order to upload an extension.
 */
export interface Confirmations {
  readonly shell_license_compliant: boolean;
  readonly tos_compliant: boolean;
}

/**
 * Upload an extension.
 *
 * @param token The API token obtained by {@link login}
 * @param confirmations Confirmed prompts for upload to e.g.o
 * @param artifactName The name of the ZIP artifact
 * @param artifactContents The contents of the zip file
 * @returns The new version of the uploaded extension.
 */
export const upload = async (
  token: string,
  confirmations: Confirmations,
  artifactName: string,
  artifactContents: Buffer,
): Promise<UploadedExtension> => {
  const body = new FormData();
  body.append(
    "shell_license_compliant",
    confirmations.shell_license_compliant.toString(),
  );
  body.append("tos_compliant", confirmations.tos_compliant.toString());
  const dataBlob = new Blob([artifactContents], {
    type: "application/zip",
  });
  body.append("source", dataBlob, artifactName);
  const response = await fetch(
    "https://extensions.gnome.org/api/v1/extensions",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...authorizationHeader(token),
      },
      body,
    },
  );
  try {
    return await readAPIResponse<UploadedExtension>(response);
  } catch (cause) {
    throw new Error("Upload failed", { cause });
  }
};

interface ExtensionMetadata {
  readonly id: number;
  readonly uuid: string;
}

/**
 * Query an extension.
 *
 * @param token The login token
 * @param uuid The extension UUID
 * @returns The metadata for the extension
 */
export const queryExtension = async (
  token: string,
  uuid: string,
): Promise<ExtensionMetadata> => {
  const response = await fetch(
    `https://extensions.gnome.org/api/v1/extensions/${uuid}/`,
    {
      headers: {
        Accept: "application/json",
        ...authorizationHeader(token),
      },
    },
  );
  try {
    return await readAPIResponse<ExtensionMetadata>(response);
  } catch (cause) {
    throw new Error("Failed to query extension metadata", { cause });
  }
};

/**
 * Prompts the user has to confirm in order to upload an extension.
 */
export type ConfirmationPrompts = {
  readonly [P in keyof Confirmations]: string;
};

interface FieldProperties {
  readonly title: string;
}

interface Schema {
  readonly components?: {
    schemas?: {
      ExtensionUpload?: { properties?: Record<string, FieldProperties> };
    };
  };
}

/**
 * Fetch confirmation prompts.
 *
 * Fetch prompts the user has to confirm in order to upload an extension.
 *
 * @returns A map of field names to human-readable prompts to confirm.
 */
export const fetchConfirmationPrompts =
  async (): Promise<ConfirmationPrompts> => {
    // We can find the prompt texts as field titles in the API schema definition,
    // so let's fetch the schema.
    const response = await fetch("https://extensions.gnome.org/api/schema/", {
      headers: {
        Accept: "application/json",
      },
    });
    const schema = (await response.json()) as Schema;
    const uploadComponent = schema.components?.schemas?.ExtensionUpload;
    const getPrompt = (field: keyof ConfirmationPrompts): string => {
      const prompt = uploadComponent?.properties?.[field]?.title;
      if (typeof prompt !== "string") {
        throw new Error(
          `Failed to find confirmation prompt for field ${field}`,
        );
      }
      return prompt;
    };
    return {
      shell_license_compliant: getPrompt("shell_license_compliant"),
      tos_compliant: getPrompt("tos_compliant"),
    };
  };
