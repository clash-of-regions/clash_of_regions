import { getPool } from "../persistence/MySQLClient";
import { getRedis } from "../persistence/RedisClient";
import { Logger } from "winston";

export class WorldServer {
  private tickInterval: NodeJS.Timer | null = null;

  constructor(private log: Logger) {}

  async start() {
    this.log.info("WorldServer starting...");
    await this.loadState();
    this.tickInterval = setInterval(() => this.tick(), 1000);
  }

  async stop() {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  private async loadState() {
    const pool = getPool();
    const [rows] = await pool.query("SELECT 1");
    this.log.info(`Loaded world state, got ${JSON.stringify(rows)}`);
    // Potentially prime Redis cache here
    getRedis();
  }

  private async tick() {
    // Placeholder tick logic
  }
}
