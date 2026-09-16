const { onDocumentCreated } = require("firebase-functions/v2/firestore")
const { initializeApp } = require("firebase-admin/app")
const { getFirestore } = require("firebase-admin/firestore")
const { getMessaging } = require("firebase-admin/messaging")

initializeApp()
const db = getFirestore()

// Dispara quando um novo alerta SOS é criado
exports.notificarSOS = onDocumentCreated("alertas_sos/{alertaId}", async (event) => {
  const alerta = event.data.data()
  const quemAcionou = alerta.usuario_id

  if (!quemAcionou) return

  // Busca o nome de quem acionou
  let nome = "Alguém do seu círculo"
  try {
    const perfil = await db.collection("usuarios").doc(quemAcionou).get()
    if (perfil.exists) nome = perfil.data().nome || nome
  } catch (e) {
    console.error("Erro ao buscar nome:", e)
  }

  // Descobre quem deve receber (círculo e grupos de quem acionou)
  const idsParaNotificar = new Set()

  // Círculos individuais
  const circulosSnap = await db.collection("circulos")
    .where("usuarios", "array-contains", quemAcionou)
    .where("status", "==", "confirmado")
    .get()
  circulosSnap.forEach(doc => {
    const data = doc.data()
    data.usuarios.forEach(id => {
      if (id !== quemAcionou) idsParaNotificar.add(id)
    })
  })

  // Grupos
  const gruposSnap = await db.collection("grupos")
    .where("membros", "array-contains", quemAcionou)
    .get()
  gruposSnap.forEach(doc => {
    const data = doc.data()
    ;(data.membros || []).forEach(id => {
      if (id !== quemAcionou) idsParaNotificar.add(id)
    })
  })

  // Busca os tokens FCM de cada pessoa
  const tokens = []
  for (const uid of idsParaNotificar) {
    try {
      const perfil = await db.collection("usuarios").doc(uid).get()
      const token = perfil.data()?.fcmToken
      if (token) tokens.push(token)
    } catch {}
  }

  if (tokens.length === 0) {
    console.log("Nenhum token para notificar")
    return
  }

  // Envia a notificação push
  const mensagem = {
    notification: {
      title: "🚨 Alerta de Emergência!",
      body: `${nome} acionou um SOS. Toque para ver a localização.`
    },
    tokens: tokens
  }

  try {
    const resposta = await getMessaging().sendEachForMulticast(mensagem)
    console.log(`Notificações enviadas: ${resposta.successCount}`)
  } catch (e) {
    console.error("Erro ao enviar push:", e)
  }
})