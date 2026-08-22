/**
 * Cria (uma única vez) o card "Árvores Cadastradas" na coleção /cards, que
 * leva à listagem/edição do Arvoredo do Bairro. Idempotente: não duplica se
 * o card já existir (verifica pela rota). Usa o Admin SDK, que ignora as
 * Firestore Security Rules.
 *
 * Autenticação (uma das opções, na ordem em que o Admin SDK tenta):
 *   1. Variável de ambiente GOOGLE_APPLICATION_CREDENTIALS apontando para um
 *      service account JSON baixado em Firebase Console > Configurações do
 *      projeto > Contas de serviço > Gerar nova chave privada.
 *   2. `gcloud auth application-default login` já executado nesta máquina.
 *
 * Uso:
 *   npm run seed:arvore-lista-card
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const { projects } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.firebaserc'), 'utf8'));

const PROJECT_ID = projects.default;
const ROTA_CARD = '/arvores';

const CARD_ARVORE_LISTA = {
  icon: 'forest',
  title: 'Árvores Cadastradas',
  info: 'Veja, edite ou remova os registros do arvoredo',
  colorClass: 'card-success',
  rota: ROTA_CARD,
  visibilidade: ['diretoria'],
  ativo: true,
};

async function main() {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });

  const firestore = admin.firestore();
  const cardsRef = firestore.collection('cards');

  const existente = await cardsRef.where('rota', '==', ROTA_CARD).limit(1).get();
  if (!existente.empty) {
    console.log(`Card "Árvores Cadastradas" já existe (id: ${existente.docs[0].id}). Nada a fazer.`);
    return;
  }

  const todos = await cardsRef.get();
  const proximaOrdem = todos.size;

  const docRef = await cardsRef.add({ ...CARD_ARVORE_LISTA, ordem: proximaOrdem });
  console.log(`Card "Árvores Cadastradas" criado com sucesso (id: ${docRef.id}, ordem: ${proximaOrdem}).`);
}

main()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error('Falha ao criar o card:', erro);
    process.exit(1);
  });
