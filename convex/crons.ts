import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "archive stale bills",
  { hourUTC: 2, minuteUTC: 0 },
  internal.bills.archiveStale
);

export default crons;
