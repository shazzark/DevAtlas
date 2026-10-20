import { releaseMonitorReportSchema, type ReleaseMonitorReport } from "@devatlas/shared";
import { ReleaseRepository } from "./repository.js";
import { fetchReleaseCandidates, ReleaseSourceError, type SourceFetch } from "./source-adapters.js";
import { releaseSourceDefinitions } from "./source-definitions.js";

export class ReleaseMonitorService {
  constructor(
    private readonly repository = new ReleaseRepository(),
    private readonly fetcher: SourceFetch = fetch,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async run(): Promise<ReleaseMonitorReport> {
    const report: ReleaseMonitorReport = {
      checkedAt: this.now().toISOString(), checkedSources: 0, failedSources: 0,
      newCandidates: 0, discoveredCandidates: 0, failures: [],
    };

    // Sequential polling is deliberate: public unauthenticated feeds have rate limits and may be intermittently unavailable.
    for (const definition of releaseSourceDefinitions) {
      if (definition.kind === "manual") {
        try {
          await this.repository.ensureSource(definition);
        } catch {
          report.failedSources += 1;
          report.failures.push({ sourceKey: definition.sourceKey, code: "SOURCE_CONFIGURATION_FAILED" });
        }
        continue;
      }

      let sourceKey = definition.sourceKey;
      try {
        const source = await this.repository.ensureSource(definition);
        if (!source.enabled) continue;
        const technologyId = await this.repository.findTechnologyId(definition.technologySlug);
        if (!technologyId) throw new Error("TECHNOLOGY_NOT_FOUND");
        report.checkedSources += 1;
        const checkedAt = this.now();
        try {
          const result = await fetchReleaseCandidates(
            definition,
            source.lastSuccessfulAt ?? null,
            source.etag ?? null,
            this.fetcher,
          );
          report.discoveredCandidates += result.candidates.length;
          report.newCandidates += await this.repository.insertCandidates(definition, technologyId, result.candidates, checkedAt);
          await this.repository.recordSourceCheck(sourceKey, checkedAt, result.etag);
        } catch (error) {
          const code = error instanceof ReleaseSourceError ? error.code : error instanceof Error && error.message === "TECHNOLOGY_NOT_FOUND" ? "TECHNOLOGY_NOT_FOUND" : "SOURCE_PROCESSING_FAILED";
          await this.repository.recordSourceCheck(sourceKey, checkedAt, source.etag ?? null, code);
          report.failedSources += 1;
          report.failures.push({ sourceKey, code });
        }
      } catch {
        report.failedSources += 1;
        report.failures.push({ sourceKey, code: "SOURCE_CONFIGURATION_FAILED" });
      }
    }
    return releaseMonitorReportSchema.parse(report);
  }
}
