# Roadmap — Novo Builder de Fichas D&D 5e

Esse documento é o mapa da viagem. A ideia aqui não é ser um manual técnico cheio de
termos difíceis, e sim deixar claro **o que a gente vai construir, em que ordem, e por quê**.
Pra detalhes mais técnicos, cada fase aponta pro que importa.

---

## A grande ideia

A gente já tem um builder funcionando (o `dnd-sheet`), mas ele cresceu meio torto.
Esse projeto novo é a chance de fazer tudo do jeito certo desde o começo, com três
metas que guiam cada decisão:

1. **Funcionar bem no celular E no computador** — não é "site de PC que abre no celular",
   é pensado pros dois desde o primeiro dia.
2. **Guardar vários personagens** e exportar a ficha como **PDF** ou como **JSON que o
   Foundry VTT abre e usa de verdade** (com ataques, magias, tudo funcionando).
3. **Nunca mais baixar dados do 5etools na mão.** O app pega os dados sozinho da internet
   e guarda no navegador.

---

## As regras do jogo que a gente segue

- **Só regras de 2024.** Mas a gente adapta conteúdo antigo (tipo raças de livros mais
  velhos) seguindo os princípios do próprio livro novo. Por isso a gente padroniza coisas
  como o nível em que a subclasse aparece.
- **Criação livre, sem "backgrounds de pacote".** Em vez de escolher um background pronto,
  o jogador monta a origem peça por peça: escolhe os bônus de atributo, o talento de origem,
  as perícias, tudo individual.
- **Multiclasse funciona.** Dá pra ter Guerreiro 1 / Bruxo 10, como nos personagens reais
  que usamos de referência.

---

## Como a gente pensa a estrutura (sem complicar)

Tem uma regra de ouro que evita 90% das dores de cabeça:

> **O personagem salvo guarda só as DECISÕES do jogador.** Todo o resto (os números finais,
> a ficha do Foundry) é calculado a partir delas na hora.

Ou seja: a gente não salva "a Força final é 18". A gente salva "o jogador pôs 15 de base,
+2 da origem e +1 do talento" — e o programa soma quando precisa. Isso deixa tudo mais fácil
de corrigir e de exportar.

Outra ideia central: **as regras de D&D ficam separadas da interface.** A parte que sabe
fazer contas de D&D não sabe nada sobre botões e telas, e vice-versa. Isso deixa a gente
testar as regras sem precisar clicar em nada.

---

## A "caixa-forte" de dados (o sistema de cache)

Essa parte é especial então merece explicação própria. O app pega os dados do 5etools de um
repositório público no GitHub e guarda no navegador. Pra não ficar baixando toda hora
(e não abusar do servidor da comunidade), funciona assim:

- **Primeira vez que abre:** mostra "Updating Compendiums...", baixa tudo, guarda com a data
  de hoje.
- **Próximas vezes:** se os dados guardados têm menos de **30 dias**, abre na hora, sem usar
  internet nenhuma.
- **Passou de 30 dias:** tenta baixar de novo pra atualizar.
- **Passou de 30 dias mas está sem internet:** tudo bem, usa os dados velhos mesmo e abre
  normal. **O app nunca trava por falta de internet** se já tiver baixado alguma vez.
- **Botão secreto:** lá no rodapé tem a versão do app (tipo "v1.0"). Se segurar ALT e clicar
  (ou segurar o dedo no celular), força baixar tudo de novo na hora, ignorando os 30 dias.

> ⚠️ **Aviso importante:** o endereço de onde os dados vêm **muda de vez em quando** (questões
> legais derrubam os repositórios e a comunidade migra). O endereço ativo hoje é
> `5etools-mirror-3/5etools-src`. Por isso esse endereço fica num lugar fácil de trocar, e a
> ideia é ter endereços reservas pra quando o principal cair.

---

## A grande mudança na interface: o "painel de seleção"

Hoje, pra escolher uma raça, o jogador abre uma listinha e procura pelo nome. Funciona, mas é
pobre — não dá pra filtrar "só raças que voam" ou "só as sem magia". No 5etools dá, e no
Pathbuilder (do Pathfinder 2e) também. A gente vai roubar essa ideia.

Em vez da listinha, todo ponto de escolha (raça, classe, talento, magia...) abre uma
**tela própria com busca, filtros relevantes e um preview** do que você tá prestes a escolher.
É **um componente só**, reaproveitado em tudo, que se vira sozinho pra ficar bom no celular
(filtros viram uma gaveta) e no PC (filtros na lateral).

---

## O assistente pra iniciantes (wizard)

Pra quem nunca jogou, a ficha cheia assusta. Então vai ter um **passo a passo**:
Nome → Espécie → Origem → Atributos → Classe → Revisão. Cada passo mostra o que já foi
decidido e explica as opções. O detalhe esperto: **o wizard e a ficha completa são a mesma
coisa por baixo** — dá pra pular pro "modo avançado" a qualquer momento sem perder nada.

---

## A parte mais delicada: exportar pro Foundry

Aqui mora o maior desafio técnico. Uma ficha do Foundry não é só "os números" — ela é um
pacotão de dezenas de "itens" completos (cada habilidade, cada magia, cada arma é um documento
cheio de detalhes). Pra ficha funcionar de verdade lá dentro, cada um desses itens precisa sair
prontinho.

Em vez de reinventar tudo isso do zero (o que levaria meses), a gente vai numa **abordagem
mista**: aproveita itens já prontos (do jeito que o Plutonium gera) guardados num "catálogo",
e só constrói na mão as partes mais especiais (tipo conteúdo traduzido ou homebrew).

Pra ter certeza que funciona, a gente usa os personagens reais (Talion, Tobias e os outros)
como **gabarito**: monta eles no builder, exporta, e compara com a ficha original do Foundry.
Se bater, tá certo.

---

## A ordem das coisas (o roteiro)

Pensado pra ter algo funcionando rápido e deixar o mais arriscado pro começo (não pro fim).

### Fase 0 — Arrumar a casa
Montar o esqueleto do projeto: pastas organizadas, navegação básica entre telas, o tema visual.
Nada de funcionalidade ainda, só a fundação.

### Fase 1 — A caixa-forte de dados
Fazer o sistema de cache que explicamos acima funcionar de ponta a ponta. É autocontido e dá
pra ver funcionando rapidinho: abre, mostra "Updating Compendiums...", recarrega e abre na hora.
**Bom ponto de partida porque não depende de mais nada.**

### Fase 2 — Guardar personagens
Definir como um personagem é representado e fazer a tela inicial onde dá pra criar, duplicar,
apagar e ter vários personagens salvos no navegador.

### Fase 3 — O cérebro das regras ⚠️
A parte que pega as decisões do jogador e calcula tudo (atributos, perícias, vida, o que cada
classe dá em cada nível). **É a parte mais difícil e mais arriscada, por isso vem cedo.** A gente
prova que tá certo testando contra os personagens reais que já temos.

### Fase 4 — O painel de seleção
Construir aquele componente de escolha com filtros que substitui as listinhas. Depois dele,
montar telas fica muito mais rápido.

### Fase 5 — A ficha completa
Juntar tudo: as abas de Origem, Classes e História, cada escolha abrindo o painel da Fase 4,
e os números aparecendo ao vivo conforme o jogador escolhe.

### Fase 6 — Exportar pro Foundry
A abordagem mista que explicamos, mais a checagem contra os personagens-gabarito.

### Fase 7 — O assistente pra iniciantes
O passo a passo, reaproveitando tudo que já foi feito.

### Fase 8 — Exportar PDF e dar o acabamento
A ficha em PDF, a parte de traduções/homebrew bem-feita, e os ajustes finais de celular e
acessibilidade.

---

## Em resumo, a sequência esperta

Começar pela **caixa-forte de dados (Fase 1)** e pela **forma do personagem (Fase 2)** — são
independentes e dão chão pra pisar. Depois encarar logo o **cérebro das regras (Fase 3)**, que é
o verdadeiro nó do projeto. Com isso resolvido, o resto (telas, wizard, exports) flui em cima de
uma base sólida.
