Trabalho feito para a disciplina de Desenvolvimento de software 2

O trabalho consiste em criar um sistema de matriculas utilizando tecnologias como node e mongoDB;

Ao baixar, utilize npm install para instalar as dependencias e node mongo_express.js para rodar o mesmo, ele subirá na porta 80;

Os requisitos dados pelo professor foram:

Você deve criar um sistema de gerenciamento de matrículas de alunos em disciplinas do curso de Sistemas da Informação. As aulas ocorrem de segunda a sexta no período noturno, com 4 horários disponíveis a cada dia. Cada disciplina pode ter até 4 horários durante a semana. Os alunos podem se matricular em qualquer disciplina, desde que as disciplinas não tenham horários em conflito.

O sistema deve ser capaz de:

- Cadastrar (criar e alterar) disciplinas, compostas por:

Código identificador único
nome
horários (mínimo 1, máximo 4), sendo que os horários não podem ter conflitos
- Cadastrar (criar e alterar) alunos, compostos por:

Número de matrícula (único)
Nome
- Matricular alunos em disciplinas (deve ser possível também cancelar uma matrícula).

Ao realizar a matrícula o sistema deve verificar se a disciplina não está em conflito com outras em que o aluno já esteja matriculado.
Observações: ao fazer uma alteração nos horários em uma disciplina existente, matrículas nessa disciplina podem ficar em conflito. Neste caso, a alteração da disciplina não deve ser bloqueada, mas deve ser possível aos alunos cancelar sua matrícula na disciplina e liberar os horários antigos.


------------
Decisões de projeto:
- Como não tive muita experiência prévia com as tecnologias necessárias, a estrutura no banco foi feita se pensando em um banco relacional, contendo Alunos, Diciplinas e matriculas, sendo que matriculas funciona como uma tabela de relação entre alunos e disciplinas.