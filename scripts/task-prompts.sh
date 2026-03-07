#!/bin/bash

prompt_deepening() {
  local task_desc="$1"
  cat <<EOF
Você é um tech lead sênior analisando uma task de desenvolvimento.

TASK DO USUÁRIO:
$task_desc

$(claude_md_section "CONTEXTO DO PROJETO (CLAUDE.md):")

Analise a task e faça o seguinte:

1. Se a task for VAGA ou AMBÍGUA (faltam informações críticas para implementar), liste até 3 perguntas objetivas necessárias. Formato:
   PRECISA_CLARIFICACAO: sim
   PERGUNTAS:
   - pergunta 1
   - pergunta 2

2. Se a task for CLARA o suficiente para implementar, gere diretamente uma spec técnica no formato:
   PRECISA_CLARIFICACAO: não

   # Spec: [título da task]

   ## Objetivo
   [o que precisa ser feito]

   ## Critérios de aceitação
   - [ ] critério 1 (testável e específico)
   - [ ] critério 2

   ## Arquivos esperados ser modificados/criados
   - arquivo1.ts — motivo

   ## Restrições e observações
   - restrição ou padrão importante do projeto

Seja direto. Não invente requisitos que não estão na task.
EOF
}

prompt_implementation() {
  local spec_content="$1"
  local previous_review="$2"

  cat <<EOF
Você é um desenvolvedor sênior Node.js/TypeScript implementando uma task.

$(claude_md_section "REGRAS E ARQUITETURA DO PROJETO (LEIA PRIMEIRO):")

## SPEC DA TASK:
$spec_content

$([ -n "$previous_review" ] && cat <<REVIEW
## PROBLEMAS DA TENTATIVA ANTERIOR (corrija estes):
$previous_review
REVIEW
)

## INSTRUÇÕES:
- Implemente EXATAMENTE o que está na spec, nem mais nem menos
- Siga rigorosamente as convenções do CLAUDE.md
- Escreva código limpo, tipado (sem 'any' desnecessário)
- Trate erros adequadamente
- NÃO faça commits, NÃO rode testes (será feito depois)
- Ao terminar, liste os arquivos criados/modificados

Implemente agora.
EOF
}

prompt_review() {
  local spec_content="$1"
  local diff="$2"

  cat <<EOF
Você é um tech lead revisando uma implementação.

## SPEC ESPERADA:
$spec_content

$(claude_md_section "PADRÕES DO PROJETO:")

## O QUE FOI IMPLEMENTADO (git diff):
$diff

## REGRAS DE REVISÃO:
- A spec é a fonte de verdade. Se a spec define um padrão (ex: styling, estrutura), a implementação DEVE seguir a spec mesmo que pareça conflitar com CLAUDE.md.
- "Design tokens only" refere-se a CORES (hex, rgb, hsl). Valores utilitários do Tailwind (sizing, spacing, font-size como text-xs, min-w-[260px]) NÃO são violações.
- Tailwind opacity modifiers (bg-warning/15, border-warning/20) NÃO são valores arbitrários — são sintaxe nativa do Tailwind.
- Só reprove por problemas FUNCIONAIS ou violações CLARAS da spec. Não reprove por preferências estilísticas.
- Se 90%+ dos critérios foram atendidos e os problemas restantes são cosméticos, APROVE com observações.

## SUA TAREFA:
Compare o que foi implementado com a spec. Responda APENAS com um dos formatos abaixo:

### Se APROVADO:
RESULTADO: APROVADO
Justificativa: [1-2 linhas do que foi bem implementado]

### Se APROVADO COM OBSERVAÇÕES:
RESULTADO: APROVADO
Justificativa: [o que foi bem implementado]
Observações menores:
- [melhoria opcional, não bloqueante]

### Se REPROVADO (apenas para falhas funcionais ou critérios claramente não atendidos):
RESULTADO: REPROVADO
Problemas encontrados:
- [problema específico 1 — seja cirúrgico, aponte arquivo e linha se possível]
- [problema específico 2]
Itens da spec não atendidos:
- [critério não cumprido]

Seja pragmático. Aprove implementações que atendem a spec funcionalmente. Só reprove por falhas reais.
EOF
}

prompt_quality() {
  local diff="$1"

  cat <<EOF
Você é um engenheiro sênior fazendo code review com foco em qualidade.

$(claude_md_section "PADRÕES DO PROJETO:")

## CÓDIGO IMPLEMENTADO (git diff):
$diff

## AVALIE os seguintes pontos e responda no formato abaixo:

### Se APROVADO (sem problemas críticos):
RESULTADO: APROVADO
Observações: [melhorias opcionais para o futuro, se houver]

### Se REPROVADO (tem problemas que precisam ser corrigidos):
RESULTADO: REPROVADO
Problemas críticos:
- [SEGURANÇA] descrição — arquivo:linha
- [CODE SMELL] descrição — arquivo:linha
- [TIPAGEM] any desnecessário ou tipo incorreto — arquivo:linha
- [DUPLICAÇÃO] lógica duplicada — onde
- [ERROR HANDLING] erro não tratado — onde

## CRITÉRIOS (só reporte problemas reais, não seja pedante):
- Vulnerabilidades de segurança óbvias (injection, secrets expostos, etc.)
- any no TypeScript onde o tipo é claramente inferível
- Funções com mais de uma responsabilidade clara
- Erros silenciados sem log (catch vazio)
- Lógica de negócio duplicada
- Variáveis/funções não utilizadas

Ignore: estilo pessoal, preferências de nomenclatura sem impacto real, otimizações prematuras.
EOF
}

prompt_quality_fix() {
  local spec_content="$1"
  local quality_result="$2"
  local diff="$3"

  cat <<EOF
Você é um desenvolvedor sênior corrigindo problemas apontados em code review.

$(claude_md_section "PADRÕES DO PROJETO:")

## SPEC ORIGINAL:
$spec_content

## PROBLEMAS ENCONTRADOS NO CODE REVIEW:
$quality_result

## CÓDIGO ATUAL:
$diff

Corrija os problemas críticos listados. Não altere funcionalidade, apenas qualidade.
EOF
}

prompt_test_fix() {
  local spec_content="$1"
  local test_output="$2"
  local diff="$3"

  cat <<EOF
Você é um desenvolvedor sênior. Os testes falharam após uma implementação.

$(claude_md_section "PADRÕES DO PROJETO:")

## SPEC DA TASK:
$spec_content

## OUTPUT DOS TESTES:
$test_output

## GIT DIFF ATUAL:
$diff

Corrija APENAS o necessário para os testes passarem sem quebrar a spec.
Não refatore código não relacionado.
EOF
}

prompt_commit() {
  local diff="$1"
  local spec_summary="$2"

  cat <<EOF
Gere uma mensagem de commit seguindo Conventional Commits para o seguinte diff:

$diff

Spec implementada:
$spec_summary

Responda APENAS com a mensagem de commit, sem explicações adicionais.
Formato: tipo(escopo): descrição curta em português

Exemplos de tipos: feat, fix, refactor, test, docs, chore
EOF
}
