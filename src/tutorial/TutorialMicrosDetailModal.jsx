import React from "react";
import MicrosDetailModal from "../MicrosDetailModal.jsx";
import { MOCK_MICROS } from "./mockData.js";

/** Modal de microescopos preenchida — demo do tour, sem API. */
export default function TutorialMicrosDetailModal({ onClose }) {
  return (
    <MicrosDetailModal
      micros={MOCK_MICROS}
      onClose={onClose}
      bodyTutorialTarget="micros-detail-modal"
      disableOverlayClose
    />
  );
}
