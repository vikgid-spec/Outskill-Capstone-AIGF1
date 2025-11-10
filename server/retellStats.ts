import Retell from 'retell-sdk';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30
const PER_PAGE_LIMIT = 250;
const MAX_RECORDS = 2000;

type RetellCall = {
  call_id?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  created_at?: string;
  updated_at?: string;
  direction?: 'inbound' | 'outbound';
  to_number?: string | null;
  from_number?: string | null;
  call_status?: string | null;
  duration_ms?: number | null;
  agent_name?: string | null;
};

type Boundaries = {
  nowUtc: Date;
  nowUtcTimestamp: number;
  todayStartUtc: Date;
  yesterdayStartUtc: Date;
};

const toTimestamp = (value: number | string | undefined | null) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

const getCallTimestamp = (call: RetellCall) => {
  const candidates = [call.start_timestamp, call.end_timestamp, call.created_at, call.updated_at];
  for (const candidate of candidates) {
    const ts = toTimestamp(candidate as any);
    if (ts !== null) {
      return ts;
    }
  }
  return null;
};

const computeIstBoundaries = (referenceDate = new Date()): Boundaries => {
  const nowUtc = referenceDate;
  const istNow = new Date(nowUtc.getTime() + IST_OFFSET_MS);
  const istStartOfToday = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()));
  const todayStartUtc = new Date(istStartOfToday.getTime() - IST_OFFSET_MS);
  const yesterdayStartUtc = new Date(todayStartUtc.getTime() - 24 * 60 * 60 * 1000);

  return {
    nowUtc,
    nowUtcTimestamp: nowUtc.getTime(),
    todayStartUtc,
    yesterdayStartUtc,
  };
};

const buildResponse = (calls: RetellCall[], boundaries: Boundaries) => {
  let today = 0;
  let yesterday = 0;

  const todayStartMs = boundaries.todayStartUtc.getTime();
  const yesterdayStartMs = boundaries.yesterdayStartUtc.getTime();

  for (const call of calls) {
    const timestamp = getCallTimestamp(call);
    if (timestamp === null) continue;

    if (timestamp >= todayStartMs && timestamp <= boundaries.nowUtcTimestamp) {
      today += 1;
    } else if (timestamp >= yesterdayStartMs && timestamp < todayStartMs) {
      yesterday += 1;
    }
  }

  return { today, yesterday };
};

export type LatestRetellCall = {
  callId: string | null;
  direction: 'inbound' | 'outbound' | null;
  toNumber: string | null;
  fromNumber: string | null;
  status: string | null;
  durationMs: number | null;
  agentName: string | null;
  timestamp: string | null;
};

export type RetellCallStats = ReturnType<typeof buildResponse> & {
  fetched: number;
  window: { start: string; end: string };
  latestCall: LatestRetellCall | null;
};

export const fetchRetellCallStats = async (apiKey: string): Promise<RetellCallStats> => {
  const client = new Retell({ apiKey });
  const boundaries = computeIstBoundaries();

  let paginationKey: string | undefined;
  const collected: RetellCall[] = [];

  while (collected.length < MAX_RECORDS) {
    const response = await client.call.list({
      limit: PER_PAGE_LIMIT,
      sort_order: 'descending',
      pagination_key: paginationKey,
      filter_criteria: {
        start_timestamp: {
          lower_threshold: boundaries.yesterdayStartUtc.getTime(),
          upper_threshold: boundaries.nowUtcTimestamp,
        },
      },
    });

    if (!Array.isArray(response) || response.length === 0) {
      break;
    }

    collected.push(...(response as RetellCall[]));

    if (response.length < PER_PAGE_LIMIT) {
      break;
    }

    const lastCall = response[response.length - 1];
    paginationKey = (lastCall && 'call_id' in lastCall ? (lastCall as RetellCall).call_id : undefined) ?? undefined;

    if (!paginationKey) {
      break;
    }
  }

  const counts = buildResponse(collected, boundaries);
  const latestCall = collected.length > 0 ? collected[0] : null;

  return {
    ...counts,
    fetched: collected.length,
    latestCall: latestCall
      ? {
          callId: latestCall.call_id ?? null,
          direction: latestCall.direction ?? null,
          toNumber: latestCall.to_number ?? null,
          fromNumber: latestCall.from_number ?? null,
          status: latestCall.call_status ?? null,
          durationMs: typeof latestCall.duration_ms === 'number' ? latestCall.duration_ms : null,
          agentName: latestCall.agent_name ?? null,
          timestamp: (() => {
            const ts = getCallTimestamp(latestCall);
            return ts ? new Date(ts).toISOString() : null;
          })(),
        }
      : null,
    window: {
      start: boundaries.yesterdayStartUtc.toISOString(),
      end: boundaries.nowUtc.toISOString(),
    },
  };
};


