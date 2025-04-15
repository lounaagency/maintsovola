
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to send a notification when a new investment is made
 */
export async function notifyInvestment(
  userId: string,
  projectId: number,
  investmentId: number,
  amount: number,
  projectTitle: string
) {
  try {
    // Get project information
    const { data: projectData, error: projectError } = await supabase
      .from('projet')
      .select(`
        id_tantsaha,
        id_superviseur,
        terrain:id_terrain(id_technicien)
      `)
      .eq('id_projet', projectId)
      .single();
    
    if (projectError) throw projectError;
    
    // Prepare recipients list
    const recipients = [];
    
    // Add project owner
    if (projectData.id_tantsaha && projectData.id_tantsaha !== userId) {
      recipients.push({
        id_utilisateur: projectData.id_tantsaha,
        role: 'owner'
      });
    }
    
    // Add supervisor
    if (projectData.id_superviseur && projectData.id_superviseur !== userId) {
      recipients.push({
        id_utilisateur: projectData.id_superviseur,
        role: 'supervisor'
      });
    }
    
    // Add technician
    if (projectData.terrain?.id_technicien && projectData.terrain.id_technicien !== userId) {
      recipients.push({
        id_utilisateur: projectData.terrain.id_technicien,
        role: 'technician'
      });
    }
    
    // Get other investors
    const { data: investorsData, error: investorsError } = await supabase
      .from('investissement')
      .select('id_investisseur')
      .eq('id_projet', projectId)
      .neq('id_investisseur', userId);
    
    if (investorsError) throw investorsError;
    
    // Add other investors to recipients
    investorsData.forEach(investor => {
      // Check for duplicates
      if (!recipients.some(r => r.id_utilisateur === investor.id_investisseur)) {
        recipients.push({
          id_utilisateur: investor.id_investisseur,
          role: 'investor'
        });
      }
    });
    
    // Create notifications for all recipients
    const notifications = recipients.map(recipient => ({
      id_expediteur: userId,
      id_destinataire: recipient.id_utilisateur,
      titre: 'Nouvel investissement',
      message: `Un nouvel investissement de ${amount} Ar a été réalisé sur le projet "${projectTitle || 'Projet #' + projectId}"${
        recipient.role === 'owner' ? ' dont vous êtes propriétaire' : 
        recipient.role === 'investor' ? ' dans lequel vous avez investi' : 
        ''
      }.`,
      type: 'info',
      entity_type: 'investissement',
      entity_id: investmentId,
      projet_id: projectId
    }));
    
    // Insert notifications if there are any recipients
    if (notifications.length > 0) {
      const { error } = await supabase.from('notification').insert(notifications);
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error sending investment notifications:", error);
    return { success: false, error };
  }
}
