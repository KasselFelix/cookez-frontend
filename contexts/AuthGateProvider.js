// AuthGateProvider — context global pour gérer les actions bloquées par
// l'absence d'un compte (vote, favori, commentaire, etc.).
//
// Pattern :
//   const { requireAuth } = useAuthGate();
//   const handleVote = () => {
//     if (!requireAuth('vote')) return;
//     // ... action authentifiée
//   };
//
// `requireAuth(reason)` :
//   - Si user.token est défini → renvoie true, l'action peut continuer
//   - Sinon → renvoie false ET ouvre la modal AuthGate avec le `reason` fourni
//
// Le reason est une clé i18n sous `auth.gate.reason.*` (vote/favorite/
// comment/comment_vote/generic). Inconnu → fallback `generic`.

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import AuthGateModal from '../components/AuthGateModal';

const AuthGateContext = createContext({
  requireAuth: () => true,
});

export function useAuthGate() {
  return useContext(AuthGateContext);
}

export default function AuthGateProvider({ children }) {
  const userToken = useSelector((s) => s?.user?.value?.token ?? null);
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState('generic');

  const requireAuth = useCallback(
    (nextReason = 'generic') => {
      if (userToken) return true;
      setReason(nextReason);
      setVisible(true);
      return false;
    },
    [userToken]
  );

  const handleClose = useCallback(() => setVisible(false), []);

  const value = useMemo(() => ({ requireAuth }), [requireAuth]);

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <AuthGateModal visible={visible} reason={reason} onClose={handleClose} />
    </AuthGateContext.Provider>
  );
}
