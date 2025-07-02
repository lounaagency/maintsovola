import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Configuration OpenWeatherMap (à configurer dans les secrets Supabase)
    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY')
    
    if (!OPENWEATHER_API_KEY) {
      console.error('OpenWeatherMap API key not configured')
      return new Response(
        JSON.stringify({ error: 'Weather service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting weather alerts processing...')

    // Récupérer tous les projets avec jalons à venir (7 prochains jours)
    const { data: jalons, error: jalonsError } = await supabaseClient
      .from('jalon_projet')
      .select(`
        id_jalon_projet,
        date_previsionnelle,
        statut,
        projet:id_projet(
          id_projet,
          titre,
          id_technicien,
          id_tantsaha,
          terrain:id_terrain(geom),
          projet_culture(
            culture:id_culture(nom_culture)
          )
        ),
        jalon_agricole:id_jalon_agricole(
          nom_jalon,
          action_a_faire
        )
      `)
      .gte('date_previsionnelle', new Date().toISOString().split('T')[0])
      .lte('date_previsionnelle', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .eq('statut', 'Prévu')

    if (jalonsError) {
      console.error('Error fetching jalons:', jalonsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch jalons' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${jalons?.length || 0} jalons to process`)

    let alertsCreated = 0

    // Traiter chaque jalon
    for (const jalon of jalons || []) {
      if (!jalon.projet?.terrain?.geom) continue

      try {
        // Extraire les coordonnées
        const coords = extractCoordinates(jalon.projet.terrain.geom)
        if (!coords) continue

        // Récupérer les prévisions météo
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=fr`
        const forecastResponse = await fetch(forecastUrl)
        
        if (!forecastResponse.ok) {
          console.error(`Weather API error for jalon ${jalon.id_jalon_projet}:`, forecastResponse.status)
          continue
        }

        const forecastData = await forecastResponse.json()
        const dayForecast = getForecastForDate(forecastData, jalon.date_previsionnelle)
        
        if (!dayForecast) continue

        // Analyser et générer des alertes
        const alerts = generateAlerts(jalon, dayForecast)
        
        // Sauvegarder les alertes
        if (alerts.length > 0) {
          const { error: insertError } = await supabaseClient
            .from('weather_alerts')
            .insert(alerts)

          if (insertError) {
            console.error('Error inserting alerts:', insertError)
          } else {
            alertsCreated += alerts.length
            console.log(`Created ${alerts.length} alerts for jalon ${jalon.id_jalon_projet}`)
          }
        }

      } catch (error) {
        console.error(`Error processing jalon ${jalon.id_jalon_projet}:`, error)
      }
    }

    console.log(`Weather alerts processing completed. Created ${alertsCreated} alerts.`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        jalonsProcessed: jalons?.length || 0,
        alertsCreated 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Fonctions utilitaires
function extractCoordinates(geom: any): { lat: number; lon: number } | null {
  try {
    if (geom.type === 'Point') {
      return { lon: geom.coordinates[0], lat: geom.coordinates[1] }
    } else if (geom.type === 'Polygon') {
      const coords = geom.coordinates[0][0]
      return { lon: coords[0], lat: coords[1] }
    }
  } catch (error) {
    console.error('Error extracting coordinates:', error)
  }
  return null
}

function getForecastForDate(forecastData: any, date: string): any {
  const targetDate = date
  for (const item of forecastData.list) {
    if (item.dt_txt.startsWith(targetDate)) {
      return {
        precipitation: item.rain?.['3h'] || 0,
        windSpeed: Math.round(item.wind.speed * 3.6), // m/s to km/h
        temperature: item.main.temp,
        conditions: item.weather[0].description
      }
    }
  }
  return null
}

function generateAlerts(jalon: any, forecast: any): any[] {
  const alerts: any[] = []
  const interventionType = detectInterventionType(jalon.jalon_agricole?.action_a_faire || '')
  
  if (!interventionType) return alerts

  const cultureName = jalon.projet.projet_culture?.[0]?.culture?.nom_culture || 'Culture'
  const baseAlert = {
    id: `${jalon.id_jalon_projet}-${Date.now()}`,
    type: '',
    title: '',
    message: '',
    recommendation: '',
    jalon_id: jalon.id_jalon_projet,
    projet_id: jalon.projet.id_projet,
    culture_type: cultureName,
    intervention_type: interventionType,
    date_previsionnelle: jalon.date_previsionnelle,
    weather_reason: '',
    priority: 'MEDIUM',
    is_active: true
  }

  // Règles d'alerte
  if (interventionType === 'SEMIS' && forecast.precipitation >= 10) {
    alerts.push({
      ...baseAlert,
      type: 'POSTPONE',
      title: `❌ Semis - ${jalon.projet.titre}`,
      message: `Semis prévu avec ${forecast.precipitation}mm de pluie annoncée (${cultureName})`,
      recommendation: 'Reporter de 2-3 jours après la pluie - sol trop humide pour un semis optimal',
      weather_reason: `${forecast.precipitation}mm de pluie prévue`,
      priority: 'HIGH'
    })
  }

  if (interventionType === 'IRRIGATION' && forecast.precipitation >= 5) {
    alerts.push({
      ...baseAlert,
      type: 'CANCEL',
      title: `⏸️ Irrigation - ${jalon.projet.titre}`,
      message: `Irrigation programmée avec ${forecast.precipitation}mm de pluie prévue (${cultureName})`,
      recommendation: 'Annuler l\'irrigation - économie d\'eau et éviter le sur-arrosage',
      weather_reason: `${forecast.precipitation}mm de pluie prévue`,
      priority: 'MEDIUM'
    })
  }

  if (interventionType === 'TRAITEMENT_PHYTO' && forecast.windSpeed >= 20) {
    alerts.push({
      ...baseAlert,
      type: 'WARNING',
      title: `⚠️ Traitement phytosanitaire - ${jalon.projet.titre}`,
      message: `Traitement prévu avec vent à ${forecast.windSpeed}km/h (${cultureName})`,
      recommendation: 'Décaler au matin ou soir - risque de dérive et efficacité réduite',
      weather_reason: `Vent à ${forecast.windSpeed}km/h`,
      priority: 'HIGH'
    })
  }

  if (interventionType === 'RECOLTE' && forecast.precipitation >= 8) {
    alerts.push({
      ...baseAlert,
      type: 'URGENT',
      title: `🚨 Récolte - ${jalon.projet.titre}`,
      message: `Récolte prévue avec ${forecast.precipitation}mm de pluie importante (${cultureName})`,
      recommendation: 'Avancer la récolte si possible - risque de perte de qualité',
      weather_reason: `${forecast.precipitation}mm de pluie prévue`,
      priority: 'CRITICAL'
    })
  }

  return alerts
}

function detectInterventionType(actionAFaire: string): string | null {
  const action = actionAFaire.toLowerCase()
  
  if (action.includes('semis') || action.includes('plantation')) return 'SEMIS'
  if (action.includes('irrigation') || action.includes('arrosage')) return 'IRRIGATION'
  if (action.includes('traitement') || action.includes('phyto')) return 'TRAITEMENT_PHYTO'
  if (action.includes('récolte') || action.includes('harvest')) return 'RECOLTE'
  if (action.includes('labour') || action.includes('préparation')) return 'LABOUR'
  
  return null
}