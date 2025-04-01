
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2 } from 'lucide-react';

const MaintsoImplementationGuide: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Guide d'implémentation Maintso Vola</h1>
      
      <Tabs defaultValue="auth">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="auth">Authentification</TabsTrigger>
          <TabsTrigger value="land">Gestion des Terrains</TabsTrigger>
          <TabsTrigger value="projects">Projets Agricoles</TabsTrigger>
          <TabsTrigger value="funding">Levée de Fonds</TabsTrigger>
          <TabsTrigger value="milestones">Jalons et Production</TabsTrigger>
        </TabsList>
        
        <TabsContent value="auth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentification et Inscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Interface d'entrée
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Deux onglets: "Connexion" et "Inscription". L'utilisateur s'inscrit avec nom, prénoms, email, téléphone et mot de passe. L'un des deux champs (email ou téléphone) est obligatoire.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Première visite
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Pour les nouveaux utilisateurs, affichage de 3 pages de landing avec boutons "Suivant", "Précédent" et "Accéder à l'application".
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Navigation principale
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Barre de navigation avec logo, icônes pour terrains/projets, messages, notifications et profil utilisateur. Sous-menu au clic sur l'avatar (Profil, Paramètres, Déconnexion).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="land" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Terrains</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Création d'un terrain
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Formulaire avec: nom du terrain, surface estimée, dessin des contours sur carte, cultures pratiquées, localisation administrative, et photos optionnelles. Notification du superviseur à la création.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Assignation et validation
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Le superviseur assigne un technicien qui planifie une visite, rédige un rapport, et valide ou rejette le terrain. Le propriétaire est notifié du résultat.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Affichage des terrains
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Interface différente selon le rôle: propriétaire (terrains en attente, terrains validés), technicien (terrains à valider, terrains validés), superviseur (terrains à assigner, terrains en attente de validation, terrains validés).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projets Agricoles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Création d'un projet
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Le propriétaire choisit un terrain validé, sélectionne les cultures, renseigne titre et description, et voit les calculs automatiques des charges et revenus prévisionnels. Héritage des photos du terrain.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Validation d'un projet
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Le technicien ajuste les informations financières et ajoute des observations. Une fois validé, le projet passe en "En cours de financement" et apparaît dans le feed.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Affichage des projets
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Deux onglets: "Projets" (en attente de validation, en cours de financement) et "Production en cours" (projets financés en phase de production).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="funding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Levée de Fonds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Feed des projets
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Deux onglets: "En cours de financement" et "En cours de production". Barre de recherche et filtres (localisation, type de culture, utilisateur).
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Carte de projet
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Entête: avatar et nom du propriétaire, localisation, date de validation.
                  Corps: titre, description, photos, informations financières, barre de progression du financement.
                  Pied: boutons Investir, Aimer, Commenter, Partager.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Processus d'investissement
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Dialog avec curseur/champ pour le montant, options de paiement (Mobile Banking, carte bancaire). Notifications automatiques après investissement aux parties prenantes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="milestones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Jalons et Production</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Définition des jalons
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Chaque projet validé suit un plan de jalons prédéfini selon le type de culture. Un jalon contient: nom, date prévue, statut, rapport du technicien, et validation par le superviseur.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Gestion des jalons
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Création automatique des jalons. Le technicien met à jour les jalons après chaque intervention avec rapport et photos. Le superviseur valide les jalons clés. Historisation des mises à jour.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Suivi et notifications
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Affichage dans la fiche projet avec barre de progression. Timeline interactive des jalons. Notifications aux investisseurs pour chaque mise à jour et alertes en cas de retard.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  Distribution des retours
                </h3>
                <p className="text-sm text-gray-600 ml-6">
                  Enregistrement des rendements réels. Calcul et distribution des retours proportionnels aux investissements. Notifications des paiements aux investisseurs.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaintsoImplementationGuide;
