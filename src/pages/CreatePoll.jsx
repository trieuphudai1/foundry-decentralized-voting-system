import React, { useRef, useState } from "react";
import { parseEventLogs } from "viem";
import { Plus, Trash2 } from "lucide-react";
import { savePollMetadata } from "../services/pollApi";
import { buildContentHash, getFriendlyError, useVotingWrite } from "../web3/hooks";
import { votingAbi } from "../web3/votingContract";
import { PageTitle, Sidebar, shortHash } from "../components/SharedUI";

function extractCreatedPollId(receipt, fallbackPollId) {
  try {
    const logs = parseEventLogs({
      abi: votingAbi,
      eventName: "PollCreated",
      logs: receipt?.logs || []
    });

    const pollId = logs[0]?.args?.pollId;
    if (pollId !== undefined) {
      return Number(pollId);
    }
  } catch (_error) {
    // Fallback below covers receipts that cannot be decoded by viem.
  }

  if (Number.isInteger(fallbackPollId) && fallbackPollId >= 0) {
    return fallbackPollId;
  }

  throw new Error("Could not read pollId from PollCreated event");
}

export default function CreatePoll({ hasPollCount, isAdmin, pollCount, setRoute, setTx, refetchPolls }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const metadataDraft = useRef(null);
  const writer = useVotingWrite(async (hash, receipt) => {
    let metadata = null;
    try {
      const draft = metadataDraft.current;
      const pollId = extractCreatedPollId(receipt, draft?.fallbackPollId);
      const { fallbackPollId, ...metadataContent } = draft;
      metadata = {
        ...metadataContent,
        pollId,
        txHash: hash
      };

      await savePollMetadata(metadata);
      await refetchPolls();
      metadataDraft.current = null;
      setTx({ status: "success", title: "Poll created", text: "Poll metadata saved and list refreshed.", hash });
      setRoute("polls");
    } catch (error) {
      setTx({
        status: "error",
        title: "Metadata save failed",
        text: error.message === "Could not read pollId from PollCreated event"
          ? "Poll was created on-chain but the pollId could not be read from the receipt."
          : "Poll was created on-chain but metadata could not be saved. Please retry saving metadata.",
        hash,
        retryMetadata: metadata
      });
    }
  });

  const submit = async (event) => {
    event.preventDefault();
    const cleanOptions = options.map((option) => option.trim()).filter(Boolean);
    const deadlineSeconds = Math.floor(new Date(deadline).getTime() / 1000);
    if (!title.trim() || !description.trim()) return setTx({ status: "error", title: "Invalid poll", text: "Title and description are required for content hash." });
    if (cleanOptions.length < 2) return setTx({ status: "error", title: "Invalid options", text: "At least two options are required." });
    if (!deadlineSeconds || deadlineSeconds <= Math.floor(Date.now() / 1000)) return setTx({ status: "error", title: "Invalid deadline", text: "Deadline must be a future Unix timestamp in seconds." });
    try {
      const contentHash = buildContentHash({ title, description });
      metadataDraft.current = {
        title: title.trim(),
        description: description.trim(),
        options: cleanOptions,
        deadline: deadlineSeconds,
        contentHash,
        fallbackPollId: hasPollCount ? Number(pollCount) : null
      };
      setTx({ status: "pending", title: "Waiting for confirmation", text: `Creating poll with hash ${shortHash(contentHash)}.` });
      const hash = await writer.write({ functionName: "createPoll", args: [contentHash, BigInt(deadlineSeconds), BigInt(cleanOptions.length)] });
      setTx({ status: "mining", title: "Creating poll", text: "Waiting for Sepolia confirmation.", hash });
    } catch (error) {
      setTx({ status: "error", title: "Create poll failed", text: getFriendlyError(error) });
    }
  };

  return (
    <section className="admin-layout">
      <Sidebar setRoute={setRoute} active="create" isAdmin={isAdmin} />
      <form className="create-panel" onSubmit={submit}>
        <PageTitle title="Create New Poll" subtitle="A bytes32 content hash is generated from title and description" />
        <div className="form-grid">
          <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter poll title" /></label>
          <label>End Date & Time<input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label>
        </div>
        <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Enter poll description" /></label>
        <div className="option-editor">
          {options.map((option, index) => (
            <React.Fragment key={index}>
              <label><input value={option} onChange={(event) => setOptions((prev) => prev.map((item, optionIndex) => optionIndex === index ? event.target.value : item))} placeholder={`Option ${index}`} /></label>
              <button className="icon-btn" type="button" aria-label="Delete option" onClick={() => setOptions((prev) => prev.filter((_, optionIndex) => optionIndex !== index))} disabled={options.length <= 2}><Trash2 size={16} /></button>
            </React.Fragment>
          ))}
        </div>
        <button className="text-link" type="button" onClick={() => setOptions((prev) => [...prev, ""])}><Plus size={14} /> Add Option</button>
        <div className="whitelist-card">
          <h3>Whitelist</h3>
          <p>Create poll first, then add voters from Whitelist using the new poll id.</p>
        </div>
        <div className="form-actions">
          <button className="secondary" type="button" onClick={() => setRoute("dashboard")}>Cancel</button>
          <button className="primary" type="submit" disabled={writer.isBusy}>{writer.isBusy ? "Processing..." : "Create Poll"}</button>
        </div>
      </form>
    </section>
  );
}
