import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { LANDING_MODAL_CONTENT } from "./landingContent.js";

const LandingModalContext = createContext(null);

export function LandingModalProvider({ children }) {
  const dialogRef = useRef(null);
  const [modalId, setModalId] = useState(null);

  const openModal = useCallback((id) => {
    setModalId(id);
    dialogRef.current?.showModal();
  }, []);

  const closeModal = useCallback(() => {
    dialogRef.current?.close();
    setModalId(null);
  }, []);

  const content = modalId ? LANDING_MODAL_CONTENT[modalId] : null;

  return (
    <LandingModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <dialog
        ref={dialogRef}
        className="landing-modal"
        onCancel={closeModal}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
      >
        {content ? (
          <>
            <article>
              <h2>{content.title}</h2>
              {content.body.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mb-3">
                  {paragraph}
                </p>
              ))}
            </article>
            <div className="landing-modal-actions">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium"
                onClick={closeModal}
              >
                Fechar
              </button>
            </div>
          </>
        ) : null}
      </dialog>
    </LandingModalContext.Provider>
  );
}

export function useLandingModal() {
  const ctx = useContext(LandingModalContext);
  if (!ctx) {
    throw new Error("useLandingModal must be used within LandingModalProvider");
  }
  return ctx;
}
