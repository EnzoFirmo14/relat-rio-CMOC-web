# Campos e Módulos Removidos do Site Web (Supervisor)

Para alinhar a plataforma supervisória web aos dados reais colhidos e enviados exclusivamente pelo aplicativo mobile (sem a inserção de dados artificiais ou controles fictícios de back-office aos quais não temos controle real), os seguintes campos e módulos foram removidos da interface web:

---

## 1. Módulos e Painéis de Controle (Dashboard)
* **Controle de Abas ("Geral", "Frota", "Segurança"):** Removido por completo. O painel agora é consolidado em uma tela unificada.
* **Módulo de Frotas Fictício:** Removido o status em tempo real de plataformas de trabalho (Operação, Manutenção, Standby, Saúde de Motor) e localização fictícia.
* **Módulo de Segurança e Riscos Fictício:** Removido o gráfico de radar contendo "Fatores de Segurança e Risco", "Taxas de Incidentes" e "Severidade de Riscos".
* **Mapa de Ocupação de Minas:** Removido o indicador de densidade e volume de ocupação de frentes de mina em tempo real.
* **Linha do Tempo Operacional (Ciclo 24h):** Removido o feed de eventos operacionais simulados (passagem de turno, monitoramento de gases simulados, etc.).

---

## 2. Indicadores (KPIs) Sem Controle do App
* **Tempo Médio de Execução (SLA / MTTR):** Removido, pois não é monitorado fora do app.
* **Ocorrências Críticas:** Removido, pois não há controle direto dessas classificações no banco.
* **Taxa de Conclusão / SLA:** Removido.
* **Equipes em Campo:** Removido o contador agregador estático.
* **Status de Conectividade ("Online / Offline / Sincronizado"):** Removido do cabeçalho global e das visualizações, uma vez que o site opera 100% online por padrão e não armazena rascunhos locais como o app.

---

## 3. Campos em Detalhes de Relatórios (Imprimir)
* **Tags de Status do Relatório:** Removidas as etiquetas indicativas de "Sincronizado", "Pendente" ou "Rascunho", exibindo diretamente os dados reais do diário.
* **Status Geral da OS:** Removidas as cores e marcadores redundantes de status da OS, mantendo a visualização limpa nas ordens de serviço.

---

## 4. Melhorias e Substituições Reais
* **Equipamentos Utilizados:** Substituído o monitoramento de frotas fictício por uma tabela dinâmica e real de **Equipamentos Utilizados**, que agrupa e lista apenas os modelos registrados nos relatórios do banco de dados, com contagem de uso e data da última utilização.
* **Funil de Filtros:** Adicionado um botão de funil interativo na lista de relatórios para exibir/ocultar a gaveta de filtros avançados, limpando o visual quando não está em uso.
