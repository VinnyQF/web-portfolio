import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";


const repositories = [
  "Seafoam-Labs/Shelly-ALPM",
  "Seafoam-Labs/Pearl",
  "Seafoam-Labs/Aqueous",
  "VinnyQF/minicurso-latex",
  "VinnyQF/web-portfolio"
];

const dataDirectory = new URL("../src/data/", import.meta.url);
const snapshotFile = new URL("repositories.json", dataDirectory);
const temporaryFile = new URL("repositories.json.tmp", dataDirectory);

async function fetchLanguages(repository) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "VinnyQF-portfolio",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${repository}/languages`,
    {
      headers,
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    throw new Error(
      `${repository}: GitHub returned ${response.status} ${response.statusText}`,
    );
  }

  const languageBytes = await response.json();

  const valid =
    languageBytes !== null &&
    typeof languageBytes === "object" &&
    !Array.isArray(languageBytes) &&
    Object.values(languageBytes).every(
      (bytes) => Number.isSafeInteger(bytes) && bytes >= 0,
    );

  if (!valid) {
    throw new Error(`${repository}: invalid language data`);
  }

  const metadataResponse = await fetch(
    `https://api.github.com/repos/${repository}`,
    {
      headers,
      signal: AbortSignal.timeout(15_000),
    },
  );
  
  if (!metadataResponse.ok) {
    throw new Error(
      `${repository}: metadata request returned ${metadataResponse.status}`,
    );
  }
  
  const metadata = await metadataResponse.json();
  const stars = metadata.stargazers_count;
  
  if (!Number.isSafeInteger(stars) || stars < 0) {
    throw new Error(`${repository}: invalid star count`);
  }


  return { languageBytes, stars };
}

async function main() {
  const results = {};

  for (const repository of repositories) {
    console.log(`Fetching ${repository}…`);
    results[repository] = await fetchLanguages(repository);
  }

  let previousSnapshot

  try {
    previousSnapshot = JSON.parse(
      await readFile(snapshotFile, "utf8"),
    );
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  if (isDeepStrictEqual(previousSnapshot?.repositories, results)) {
    console.log("Repository data is unchanged; keeping the existing snapshot.");
    return;
  }
  
  const snapshot = {
    updatedAt: new Date().toISOString(),
    repositories: results,
  };

  await mkdir(dataDirectory, { recursive: true });

  await writeFile(
    temporaryFile,
    `${JSON.stringify(snapshot, null, 2)}\n`,
    "utf8",
  );

  await rename(temporaryFile, snapshotFile);

  console.log(`Saved repository snapshot: ${snapshot.updatedAt}`);
}

main().catch((error) => {
  console.error(`Repository refresh failed: ${error.message}`);
  process.exitCode = 1;
});
