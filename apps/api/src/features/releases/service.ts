import {
  releaseDetailResponseSchema,
  releaseListQuerySchema,
  releaseListResponseSchema,
  releaseReviewDecisionSchema,
} from "@devatlas/shared";
import { ReleaseRepository } from "./repository.js";

export class ReleaseNotFoundError extends Error {
  constructor() { super("Release not found"); this.name = "ReleaseNotFoundError"; }
}

export class ReleaseReviewConflictError extends Error {
  constructor(message: string) { super(message); this.name = "ReleaseReviewConflictError"; }
}

export class ReleaseService {
  constructor(private readonly repository = new ReleaseRepository()) {}

  async list(rawQuery: unknown) {
    const query = releaseListQuerySchema.parse(rawQuery);
    return releaseListResponseSchema.parse(await this.repository.listPublished(query));
  }

  async get(slug: string) {
    const item = await this.repository.findPublishedBySlug(slug);
    if (!item) throw new ReleaseNotFoundError();
    return releaseDetailResponseSchema.parse({ item });
  }

  async candidates() {
    return this.repository.listCandidates();
  }

  async review(slug: string, rawDecision: unknown, actorId: string) {
    const decision = releaseReviewDecisionSchema.parse(rawDecision);
    const current = await this.repository.findEditorialStatus(slug);
    if (!current) throw new ReleaseNotFoundError();

    if (decision.decision === "submit_for_review") {
      if (current !== "draft") throw new ReleaseReviewConflictError("Only a draft can be submitted for review");
      const result = await this.repository.updateEditorialDecision(slug, "draft", "review", decision.content);
      if (!result) throw new ReleaseReviewConflictError("Release changed while the review update was being saved");
      return result;
    }

    if (decision.decision === "return_to_draft") {
      if (current !== "review") throw new ReleaseReviewConflictError("Only a review item can return to draft");
      const result = await this.repository.updateEditorialDecision(slug, "review", "draft", undefined);
      if (!result) throw new ReleaseReviewConflictError("Release changed while the review update was being saved");
      return result;
    }

    if (current !== "review") throw new ReleaseReviewConflictError("Only a reviewed item can be published");
    const result = await this.repository.updateEditorialDecision(slug, "review", "published", decision.content, actorId);
    if (!result) throw new ReleaseReviewConflictError("Release changed while the publication update was being saved");
    return result;
  }
}
