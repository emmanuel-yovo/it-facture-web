'use client'

import { useEffect, useState } from 'react'
import { CallBackProps, STATUS, Step } from 'react-joyride'
import dynamic from 'next/dynamic'
const Joyride = dynamic(() => import('react-joyride').then(mod => mod.Joyride as any), { ssr: false }) as any
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { settingsRepository } from '@/lib/repositories/settings.repository'

export function TutorialTour() {
  const { workspaceId, user } = useAuthStore()
  const [run, setRun] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // On vérifie si le tutoriel a déjà été complété pour ce workspace
  useEffect(() => {
    setIsClient(true)
    
    const checkTutorialStatus = async () => {
      if (!workspaceId) return
      
      try {
        const settings = await settingsRepository.getSettings(workspaceId)
        
        // Si la clé n'existe pas ou n'est pas 'true', on lance le tuto
        if ((settings as any).tutorial_completed !== 'true') {
          setTimeout(() => {
            setRun(true)
          }, 1500)
        }
      } catch (err) {
        console.error("Erreur lors de la vérification du statut du tutoriel", err)
      }
    }

    checkTutorialStatus()
  }, [workspaceId])

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: 'Bienvenue sur IT-Facture !',
      content: "Faisons un petit tour rapide pour vous montrer comment fonctionne votre nouvel outil de facturation. Ça ne prendra qu'une minute !",
      disableBeacon: true,
    },
    {
      target: '[data-tour="nav-clients"]',
      title: 'Vos Clients',
      content: "C'est ici que vous pourrez ajouter et gérer votre base de données clients. Vous pouvez même importer une liste Excel existante !",
    },
    {
      target: '[data-tour="nav-services"]',
      title: 'Vos Produits & Services',
      content: "Ajoutez ici tout ce que vous vendez. Cela vous fera gagner un temps précieux lors de la création de vos factures.",
    },
    {
      target: '[data-tour="nav-invoices"]',
      title: 'Création de Factures',
      content: "L'endroit le plus important ! C'est ici que vous créez, envoyez et suivez le paiement de vos factures et devis.",
    },
    {
      target: '[data-tour="nav-settings"]',
      title: 'Personnalisation',
      content: "N'oubliez pas de configurer votre profil ! Ajoutez votre logo, vos conditions de vente et configurez vos e-mails.",
    },
    {
      target: '[data-tour="nav-help"]',
      title: 'Besoin d\'aide ?',
      content: "Si vous êtes perdu, notre Centre d'Aide est toujours disponible ici avec des guides complets.",
    }
  ]

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setRun(false)
      // Sauvegarder dans la DB que le tutoriel est terminé
      if (workspaceId) {
        try {
          await settingsRepository.saveSettings(workspaceId, {
            tutorial_completed: 'true'
          } as any)
        } catch (e) {
          console.error("Erreur lors de la sauvegarde du tutoriel:", e)
        }
      }
    }
  }

  if (!isClient) return null

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      scrollToFirstStep={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#6366f1', // Indigo-500
          zIndex: 10000,
        },
        buttonClose: {
          display: 'none',
        },
        tooltip: {
          borderRadius: '12px',
          padding: '24px',
        },
        tooltipTitle: {
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      }}
      locale={{
        back: 'Précédent',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        skip: 'Passer le tutoriel',
      }}
    />
  )
}
