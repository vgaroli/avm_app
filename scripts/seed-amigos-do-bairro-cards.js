/**
 * Cria (uma única vez) os cards "Amigos do Bairro" (público) e "Gerenciar
 * Estabelecimentos" (diretoria) na coleção /cards, usados pelo módulo
 * Estabelecimentos Amigos do Bairro. Idempotente: não duplica se o card já
 * existir (verifica pela rota). Usa o Admin SDK, que ignora as Firestore
 * Security Rules.
 *
 * Autenticação (uma das opções, na ordem em que o Admin SDK tenta):
 *   1. Variável de ambiente GOOGLE_APPLICATION_CREDENTIALS apontando para um
 *      service account JSON baixado em Firebase Console > Configurações do
 *      projeto > Contas de serviço > Gerar nova chave privada.
 *   2. `gcloud auth application-default login` já executado nesta máquina.
 *
 * Uso:
 *   npm run seed:amigos-do-bairro-cards
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const { projects } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.firebaserc'), 'utf8'));

const PROJECT_ID = projects.default;

const CARDS = [
  {
    rota: '/amigos-do-bairro',
    dados: {
      icon: 'storefront',
      title: '🏪 Amigos do Bairro',
      info: 'Estabelecimentos reconhecidos pela AVM',
      colorClass: 'card-success',
      rota: '/amigos-do-bairro',
      visibilidade: ['publico'],
      ativo: true,
    },
  },
  {
    rota: '/admin/estabelecimentos',
    dados: {
      icon: 'storefront',
      title: '🏪 Gerenciar Estabelecimentos',
      info: 'Cadastrar e aprovar Amigos do Bairro',
      colorClass: 'card-primary',
      rota: '/admin/estabelecimentos',
      visibilidade: ['diretoria'],
      ativo: true,
    },
  },
];

async function main() {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });

  const firestore = admin.firestore();
  const cardsRef = firestore.collection('cards');

  for (const { rota, dados } of CARDS) {
    const existente = await cardsRef.where('rota', '==', rota).limit(1).get();
    if (!existente.empty) {
      console.log(`Card "${dados.title}" já existe (id: ${existente.docs[0].id}). Nada a fazer.`);
      continue;
    }

    const todos = await cardsRef.get();
    const proximaOrdem = todos.size;

    const docRef = await cardsRef.add({ ...dados, ordem: proximaOrdem });
    console.log(`Card "${dados.title}" criado com sucesso (id: ${docRef.id}, ordem: ${proximaOrdem}).`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error('Falha ao criar os cards:', erro);
    process.exit(1);
  });
