// Native fetch is used

async function testCron() {
  console.log("🚀 Lancement du test local de la relance automatique...");

  try {
    const res = await fetch('http://localhost:3000/api/cron/reminders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer Emmanu@7134_9636` // Votre CRON_SECRET
      }
    });

    const data = await res.json();
    console.log("✅ Résultat de l'API :", data);
  } catch (error) {
    console.error("❌ Erreur de connexion (Le serveur tourne-t-il sur le port 3000 ?) :", error.message);
  }
}

testCron();
