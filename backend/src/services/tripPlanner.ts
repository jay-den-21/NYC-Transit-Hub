import { promises as fs } from "node:fs";
import path from "node:path";

const STOP_TIMES_FILE = path.resolve(process.cwd(), "GTFS_static_data/gtfs_subway/stop_times.txt");

interface StopTime {
    trip_id: string;
    arrival_time: string;
    departure_time: string;
    stop_id: string;
    stop_sequence: number;
}

let tripStopSequences: Map<string, StopTime[]> | null = null;
const tripIdCache = new Map<string, string>();

const parseCsvLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
  
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
};

const loadStopTimes = async (): Promise<void> => {
    if (tripStopSequences) return;

    try {
        const raw = await fs.readFile(STOP_TIMES_FILE, "utf-8");
        const lines = raw.split(/\r?\n/);
        const headers = parseCsvLine(lines[0]);
        const tripIdIndex = headers.indexOf('trip_id');
        const arrivalTimeIndex = headers.indexOf('arrival_time');
        const departureTimeIndex = headers.indexOf('departure_time');
        const stopIdIndex = headers.indexOf('stop_id');
        const stopSequenceIndex = headers.indexOf('stop_sequence');

        const sequences = new Map<string, StopTime[]>();
        for (let i = 1; i < lines.length; i += 1) {
            const line = lines[i]?.trim();
            if (!line) continue;
            const values = parseCsvLine(line);
            const record: StopTime = {
                trip_id: values[tripIdIndex],
                arrival_time: values[arrivalTimeIndex],
                departure_time: values[departureTimeIndex],
                stop_id: values[stopIdIndex],
                stop_sequence: parseInt(values[stopSequenceIndex], 10)
            };

            if (!sequences.has(record.trip_id)) {
                sequences.set(record.trip_id, []);
            }
            sequences.get(record.trip_id)!.push(record);
        }

        // Sort the stops in each trip by sequence
        for (const tripId of sequences.keys()) {
            sequences.get(tripId)!.sort((a, b) => a.stop_sequence - b.stop_sequence);
        }

        tripStopSequences = sequences;
    } catch (error) {
        console.warn("Unable to load stop_times.txt for trip sequence lookup", error);
        tripStopSequences = new Map();
    }
};

export const getTripStopSequence = async (tripId: string): Promise<StopTime[] | null> => {
    if (!tripStopSequences) {
        await loadStopTimes();
    }

    if (tripIdCache.has(tripId)) {
        return tripStopSequences?.get(tripIdCache.get(tripId)!) ?? null;
    }

    if (tripStopSequences?.has(tripId)) {
        return tripStopSequences.get(tripId) ?? null;
    }

    for (const fullTripId of tripStopSequences?.keys() ?? []) {
        if (fullTripId.endsWith(tripId)) {
            tripIdCache.set(tripId, fullTripId);
            return tripStopSequences?.get(fullTripId) ?? null;
        }
    }

    return null;
};

export const getPreviousStop = async (tripId: string, stopId: string): Promise<StopTime | null> => {
    const sequence = await getTripStopSequence(tripId);
    if (!sequence) {
        return null;
    }

    const stopIndex = sequence.findIndex(s => s.stop_id === stopId);
    if (stopIndex > 0) {
        return sequence[stopIndex - 1];
    }

    return null;
};