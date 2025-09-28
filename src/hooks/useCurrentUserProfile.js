import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export function useCurrentUserProfil(userId) {
  const [profil, setProfil] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchProfil = async () => {
      const { data, error } = await supabase
        .from("utilisateurs")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error) setProfil(data);
    };

    fetchProfil();
  }, [userId]);

  return profil;
}
