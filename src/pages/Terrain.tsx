
// This is a partial update to fix the utilisateur relationship querying
const { data, error } = await supabase
  .from('terrain')
  .select(`
    *,
    tantsaha:id_tantsaha(id_utilisateur, nom, prenoms),
    superviseur:id_superviseur(id_utilisateur, nom, prenoms),
    technicien:id_technicien(id_utilisateur, nom, prenoms),
    region:id_region(nom_region),
    district:id_district(nom_district),
    commune:id_commune(nom_commune)
  `)
  .eq(userRole === 'agriculteur' ? 'id_tantsaha' : 'terrain.id_terrain', 
      userRole === 'agriculteur' ? user.id : 'terrain.id_terrain')
  .order('created_at', { ascending: false });

// Then later, when displaying the user information
<td>
  {terrain.tantsaha?.nom} {terrain.tantsaha?.prenoms}
</td>
