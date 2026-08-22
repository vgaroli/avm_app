/**
 * Cria (uma única vez) os cards "Minha Credencial" e "Validar Credencial" na
 * coleção /cards, usados pelo módulo de credencial digital. Idempotente: não
 * duplica se o card já existir (verifica pela rota). Usa o Admin SDK, que
 * ignora as Firestore Security Rules.
 *
 * Autenticação (uma das opções, na ordem em que o Admin SDK tenta):
 *   1. Variável de ambiente GOOGLE_APPLICATION_CREDENTIALS apontando para um
 *      service account JSON baixado em Firebase Console > Configurações do
 *      projeto > Contas de serviço > Gerar nova chave privada.
 *   2. `gcloud auth application-default login` já executado nesta máquina.
 *
 * Uso:
 *   npm run seed:credencial-cards
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const { projects } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.firebaserc'), 'utf8'));

const PROJECT_ID = projects.default;

const CARDS = [
  {
    icon: 'badge',
    title: 'Minha Credencial',
    info: 'Sua credencial digital com QR code para apresentar na portaria',
    colorClass: 'card-primary',
    rota: '/credencial',
    visibilidade: ['ativo'],
    ativo: true,
  },
  {
    icon: 'qr_code_scanner',
    title: 'Validar Credencial',
    info: 'Escaneie o QR code do associado para conferir a situação',
    colorClass: 'card-success',
    rota: '/validar-credencial',
    visibilidade: ['parceiro', 'diretoria'],
    ativo: true,
  },
];

async function main() {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });

  const firestore = admin.firestore();
  const cardsRef = firestore.collection('cards');

  for (const card of CARDS) {
    const existente = await cardsRef.where('rota', '==', card.rota).limit(1).get();
    if (!existente.empty) {
      console.log(`Card "${card.title}" já existe (id: ${existente.docs[0].id}). Nada a fazer.`);
      continue;
    }

    const todos = await cardsRef.get();
    const proximaOrdem = todos.size;

    const docRef = await cardsRef.add({ ...card, ordem: proximaOrdem });
    console.log(`Card "${card.title}" criado com sucesso (id: ${docRef.id}, ordem: ${proximaOrdem}).`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error('Falha ao criar os cards:', erro);
    process.exit(1);
  });
