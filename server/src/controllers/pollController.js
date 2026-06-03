import { PollMetadata } from "../models/PollMetadata.js";

function normalizePayload(body) {
  const options = Array.isArray(body.options)
    ? body.options.map((option) => String(option).trim()).filter(Boolean)
    : [];

  return {
    pollId: Number(body.pollId),
    title: String(body.title || "").trim(),
    description: String(body.description || "").trim(),
    options,
    deadline: Number(body.deadline),
    contentHash: String(body.contentHash || "").toLowerCase(),
    txHash: String(body.txHash || "").toLowerCase()
  };
}

function buildPayload(req) {
  const payload = normalizePayload(req.body);
  if (req.params.pollId !== undefined && req.params.pollId !== payload.pollId.toString()) {
    payload.pollId = Number(req.params.pollId);
  }

  return payload;
}

export async function listPolls(_req, res, next) {
  try {
    const polls = await PollMetadata.find().sort({ pollId: -1 });
    res.json(polls);
  } catch (error) {
    next(error);
  }
}

export async function getPoll(req, res, next) {
  try {
    const poll = await PollMetadata.findOne({ pollId: Number(req.params.pollId) });
    if (!poll) {
      return res.status(404).json({ message: "Poll metadata not found" });
    }
    res.json(poll);
  } catch (error) {
    next(error);
  }
}

export async function savePoll(req, res, next) {
  try {
    const payload = buildPayload(req);
    if (!Number.isInteger(payload.pollId) || payload.pollId < 0) {
      return res.status(400).json({ message: "Valid pollId is required" });
    }

    const poll = await PollMetadata.findOneAndUpdate(
      { pollId: payload.pollId },
      payload,
      { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(poll);
  } catch (error) {
    next(error);
  }
}

export function handleError(error, _req, res, _next) {
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "Poll metadata already exists" });
  }

  res.status(500).json({ message: error.message || "Server error" });
}
