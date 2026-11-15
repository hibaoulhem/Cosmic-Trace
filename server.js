import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4173;
const production = process.argv.includes("--production");

app.use(express.json({ limit: "1mb" }));

const MAST_URL = "https://mast.stsci.edu/api/v0/invoke";
const HORIZONS_URL = "https://ssd-api.jpl.nasa.gov/api/horizons.api";

const PLANETS = {
  Mercury: "199",
  Venus: "299",
  Earth: "399",
  Mars: "499",
  Jupiter: "599",
  Saturn: "699",
  Uranus: "799",
  Neptune: "899"
};

async function mastRequest(service, params) {
  const request = {
    service,
    params,
    format: "json",
    pagesize: 100,
    page: 1
  };

  const body = new URLSearchParams({
    request: JSON.stringify(request)
  });

  const response = await fetch(MAST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    throw new Error(`MAST returned HTTP ${response.status}`);
  }

  return response.json();
}

function parseHorizonsPosition(result, name) {
  const match = result.match(/\$\$SOE([\s\S]*?)\$\$EOE/);

  if (!match) {
    throw new Error(`No ephemeris data returned for ${name}`);
  }

  const row = match[1]
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(line => line && line.includes(","));

  if (!row) {
    throw new Error(`Empty ephemeris result for ${name}`);
  }

  const fields = row.split(",").map(value => value.trim());

  const x = Number(fields[2]);
  const y = Number(fields[3]);
  const z = Number(fields[4]);

  if (![x, y, z].every(Number.isFinite)) {
    throw new Error(`Invalid coordinates for ${name}`);
  }

  return { name, x, y, z, unit: "AU" };
}

async function getPlanetPosition(name, id, timestamp) {
  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${id}'`,
    OBJ_DATA: "NO",
    MAKE_EPHEM: "YES",
    EPHEM_TYPE: "VECTORS",
    CENTER: "'500@10'",
    TLIST: `'${timestamp}'`,
    TIME_TYPE: "UT",
    VEC_TABLE: "1",
    OUT_UNITS: "AU-D",
    REF_PLANE: "ECLIPTIC",
    VEC_CORR: "NONE",
    CSV_FORMAT: "YES",
    VEC_LABELS: "NO"
  });

  const response = await fetch(
    `${HORIZONS_URL}?${params}`
  );

  if (!response.ok) {
    throw new Error(`JPL returned HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.result) {
    throw new Error(`No JPL result for ${name}`);
  }

  return parseHorizonsPosition(data.result, name);
}

/* REAL JPL PLANET POSITIONS */

app.get("/api/planet-positions", async (req, res) => {
  try {
    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .replace("Z", "")
      .slice(0, 19);

    const positions = await Promise.all(
      Object.entries(PLANETS).map(([name, id]) =>
        getPlanetPosition(name, id, timestamp)
      )
    );

    res.json({
      success: true,
      source: "NASA/JPL Horizons",
      time: timestamp,
      positions
    });
  } catch (error) {
    console.error("JPL error:", error);

    res.status(502).json({
      success: false,
      error: error.message
    });
  }
});

/* MAST TELESCOPE ARCHIVE */

app.post("/api/mast", async (req, res) => {
  try {
    const { service, params } = req.body || {};

    const allowedServices = [
      "Mast.Name.Lookup",
      "Mast.Caom.Cone"
    ];

    if (!allowedServices.includes(service)) {
      return res.status(400).json({
        error: "Unsupported MAST service."
      });
    }

    if (!params || typeof params !== "object") {
      return res.status(400).json({
        error: "Missing MAST parameters."
      });
    }

    const result = await mastRequest(service, params);

    res.json(result);
  } catch (error) {
    console.error("MAST error:", error);

    res.status(502).json({
      error: error.message
    });
  }
});

/* PRODUCTION WEBSITE */

if (production) {
  app.use(express.static(path.join(__dirname, "dist")));

  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
} else {
  /* VITE DEVELOPMENT SERVER */

  const vite = await createViteServer({
    configFile: path.join(__dirname, "vite.config.js"),
    server: {
      middlewareMode: true
    },
    appType: "spa"
  });

  app.use(vite.middlewares);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Cosmic Trace is running on port ${PORT}`);
  console.log(
    production
      ? "Production mode"
      : "Development mode"
  );
});