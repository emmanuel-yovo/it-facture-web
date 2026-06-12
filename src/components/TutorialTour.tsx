'use client'

import { useEffect, useState } from 'react'
import { CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride'
import dynamic from 'next/dynamic'
import { useAuthStore } from '@/store/authStore'
import { settingsRepository } from '@/lib/repositories/settings.repository'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

// Dynamically import Joyride to avoid SSR issues
const Joyride = dynamic(() => import('react-joyride').then(mod => mod.Joyride as any), { ssr: false }) as any

// Custom Tooltip for 100% control over rendering and buttons
const CustomTooltip = ({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
}: TooltipRenderProps) => {
  return (
    <div {...tooltipProps} className="bg-card text-foreground p-5 rounded-xl shadow-2xl max-w-[350px] border border-border font-sans">
      <div className="flex justify-between items-start mb-3">
        {step.title && <h3 className="font-bold text-lg pr-4">{step.title}</h3>}
        <button {...closeProps} className="text-muted-foreground hover:text-foreground p-1 -mr-2 -mt-2 rounded-full hover:bg-muted transition-colors" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="text-sm text-muted-foreground mb-6 leading-relaxed">
        {step.content}
      </div>
      
      <div className="flex justify-between items-center mt-4">
        {!isLastStep ? (
          <button {...skipProps} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Passer le tutoriel
          </button>
        ) : (
          <div /> // Empty div to push next buttons to the right
        )}
        
        <div className="flex gap-2">
          {index > 0 && (
            <Button variant="outline" size="sm" {...backProps}>
              Précédent
            </Button>
          )}
          <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" {...primaryProps}>
            {isLastStep ? 'Terminer' : 'Suivant'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TutorialTour() {
  const { workspaceId } = useAuthStore()
  const [run, setRun] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Logique plus propre et robuste
  useEffect(() => {
    setIsClient(true)
    
    if (!workspaceId) return
    
    const checkTutorial = async () => {
      // 1. Vérification locale super rapide
      const localStatus = localStorage.getItem(`tutorial_done_${workspaceId}`)
      if (localStatus === 'true') return
      
      // 2. Vérification DB
      try {
        const settings = await settingsRepository.getSettings(workspaceId)
        if ((settings as any).tutorial_completed === 'true') {
          localStorage.setItem(`tutorial_done_${workspaceId}`, 'true')
          return
        }
        
        // Si non complété, on lance
        setTimeout(() => setRun(true), 1000)
      } catch (err) {
        console.error("Erreur vérification tutoriel:", err)
        // En cas d'erreur réseau, on lance quand même le tuto
        setTimeout(() => setRun(true), 1000)
      }
    }

    checkTutorial()
  }, [workspaceId])

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: 'Bienvenue sur IT-Facture !',
      content: "Faisons un petit tour rapide pour vous montrer comment fonctionne votre nouvel outil. Ça ne prendra qu'une minute !",
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

  const dismissTutorial = () => {
    setRun(false)
    if (workspaceId) {
      localStorage.setItem(`tutorial_done_${workspaceId}`, 'true')
      settingsRepository.saveSettings(workspaceId, { tutorial_completed: 'true' } as any)
        .catch(e => console.error("Erreur sauvegarde tutoriel:", e))
    }
  }

  const handleCallback = (data: CallBackProps) => {
    const { status, action } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    // Si terminé, skippé ou fermé via la croix
    if (finishedStatuses.includes(status) || action === 'close') {
      dismissTutorial()
    }
  }

  if (!isClient) return null

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      callback={handleCallback}
      tooltipComponent={CustomTooltip}
      disableOverlayClose={false}
      styles={{
        options: {
          zIndex: 10000,
        }
      }}
    />
  )
}
