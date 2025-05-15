
// Updating only the function with the type error in Profile.tsx
// This is the fetchUserProfile function that needs to be updated

const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('utilisateur')
      .select(`
        *,
        role:id_role(nom_role),
        telephones:telephone(*)
      `)
      .eq('id_utilisateur', userId)
      .single();
    
    if (error) throw error;
    
    const telephones = data.telephones || [];
    const mappedTelephones = telephones.map((tel: any) => ({
      id_telephone: tel.id_telephone,
      id_utilisateur: tel.id_utilisateur,
      numero: tel.numero,
      type: tel.type as "principal" | "whatsapp" | "mvola" | "orange_money" | "airtel_money" | "autre",
      est_whatsapp: tel.est_whatsapp,
      est_mobile_banking: tel.est_mobile_banking,
      created_at: tel.created_at || new Date().toISOString(),
      modified_at: tel.modified_at || new Date().toISOString()
    }));
    
    setProfile({
      id_utilisateur: isSelectQueryError(data) ? '' : data.id_utilisateur,
      id: isSelectQueryError(data) ? '' : data.id_utilisateur,
      nom: isSelectQueryError(data) ? '' : data.nom,
      prenoms: isSelectQueryError(data) ? '' : data.prenoms,
      email: isSelectQueryError(data) ? '' : data.email,
      photo_profil: isSelectQueryError(data) ? '' : data.photo_profil,
      photo_couverture: isSelectQueryError(data) ? '' : data.photo_couverture,
      telephone: isSelectQueryError(data) ? '' : telephones[0]?.numero,
      adresse: isSelectQueryError(data) ? '' : data.adresse || undefined,
      bio: isSelectQueryError(data) ? '' : data.bio || undefined,
      id_role: isSelectQueryError(data) ? null : data.id_role,
      nom_role: isSelectQueryError(data) ? '' : data.role?.nom_role,
      telephones: mappedTelephones
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    toast.error("Impossible de charger le profil de l'utilisateur");
  }
};
