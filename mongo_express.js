const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:sadmin@cluster0-t6ug9.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const express = require('express');
const expressLayouts = require('express-ejs-layouts');

var app = express();
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.urlencoded());

const port = 80;
const dbName = "matriculas";

app.use(express.static(__dirname + '/public'));

/////////////////////////////////////////////
//Banco
//////////////////////////////////////////////
function buscaAlunos() {
    return client
            .db(dbName)
            .collection("aluno")
            .find({});
}

function buscaAlunoPorMatricula(matricula){
    return client
                .db(dbName)
                .collection("aluno")
                .findOne({matriculaAluno: matricula})                    
}

function buscaDisciplinas() {
    return client
            .db(dbName)
            .collection("disciplina")
            .find({})
}

function insereAlunoNoBanco(nome, matricula) {
    client
        .db(dbName)
        .collection("aluno")
        .insertOne({nome: nome, matriculaAluno: matricula});
}

function insereDisciplinaNoBanco(nome, codigo, horariosDiciplinas) {
    client
        .db(dbName)
        .collection("disciplina")
        .insertOne({nome: nome, codigoDisciplina: codigo, horarios: horariosDiciplinas});
}

function atualizaAlunoNoBanco(nome, matricula) {
    client
    .db(dbName)
    .collection("aluno")
    .updateOne(
        {
            matriculaAluno: matricula
        },
        {
            $set: {nome: nome}
        },
        function (err, result) {
            if (err) {
                console.log(err  + "errror banco");
                throw err;
            }
            return;
        });
}

function atualizaDisciplinaNoBanco(codigo, nome, horariosDiciplinas, res) {
    client
        .db(dbName)
        .collection("disciplina")
        .updateOne(
            {
                codigoDisciplina: codigo
            },
            {
                $set: {nome: nome, horarios: horariosDiciplinas}
            },
            function (err, result) {
                if (err) {
                    console.log(err);
                    throw err;
                }
                res.redirect("/");
                return;
            });
}

function buscaDisciplinaPorCodigo(codigo) {
    return client
            .db(dbName)
            .collection("disciplina")
            .findOne({codigoDisciplina: codigo})
}

/////////////////////////////////////////////
//Lógica
//////////////////////////////////////////////
app.get("/", function(req, res) {
    renderizaPaginaInicial(res);
});

function renderizaPaginaInicial(res) {
    buscaAlunos()
        .toArray(function (err, alunos) {
            buscaDisciplinas()
                .toArray(function (err, disciplinas) {
                    res.render("home", {title: "Início", listaAlunos: alunos, listaDisciplinas: disciplinas});
                });
        });
}

app.get("/managementMatricula", function(req, res){
    buscaAlunos()
        .toArray(function(err, alunos){
            res.render("managementMatricula",{title: "Gerenciamento De Matriculas", listaAlunos: alunos})
        })

});

app.get("/registerAluno", function(req, res) {
    res.render("registerAluno", {
        title: "Novo aluno",
        aluno: {}
    });
});

app.get("/registerAluno/:matriculaAluno", function(req, res) {
    buscaAlunoPorMatricula(req.params.matriculaAluno)
        .then(function (aluno) {
            if (!aluno){
                renderizaTelaNotFound(res);
            } else {
                res.render("registerAluno", {
                    title: "Alterar aluno", 
                    aluno: aluno
                });
            }
        });
});

function validateAluno(nome, matricula, res) {
    if (!nome || !matricula) {
        return false;
    }

    return true;
}

function validateDisciplina(nome, codigo, qtdHorariosSelecionados, res) {
    if (!nome || !codigo || (qtdHorariosSelecionados < 1 || qtdHorariosSelecionados > 4)) {
        return false;
    }

    return true;
}

function renderizaTelaDadoJaCadastrado(res) {
    res.render("dadoJaCadastrado", {codigo: codigo, title: "Dado já cadastrado"});
}

function renderizaTelaBadRequest(res) {
    res.render("badRequest", {title: "Requisição inválida"});
}

function renderizaTelaNotFound(res) {
    res.render("naoEncontrado", {title: "Não Encontrado"});
}

function cadastraNovoAluno(req, res) {
    let matricula = req.body.matriculaAluno.trim();
   
    buscaAlunoPorMatricula(matricula)
       .then(function(aluno) {
            if(aluno) {
                renderizaTelaDadoJaCadastrado(res);
            } else {
                let nome = req.body.nome.trim();
                let isAlunoValido = validateAluno(nome, matricula, res);

                if (isAlunoValido) {
                    insereAlunoNoBanco(nome, matricula);
                    res.redirect("/");
                } else {
                    renderizaTelaBadRequest(res);
                }
            }
        });
}

function atualizaAluno(req, res) {
    const nome = req.body.nome.trim();
    const matricula = req.params.matricula;

    const isAlunoValido = validateAluno(nome, matricula); 

    if (!isAlunoValido) {
        renderizaTelaBadRequest(res);
    } else {
        atualizaAlunoNoBanco(nome, matricula);
        res.redirect("/");
    }
}

app.post("/registerAluno/:matricula?", function(req, res) {
    if (!req.params.matricula) {
        cadastraNovoAluno(req, res);
    } else {
        atualizaAluno(req, res);
    }
}); 

app.get("/registerDisciplina", function(req, res) {
    res.render("registerDisciplina", {
        title: "Nova disciplina",
        disciplina: {}
    });
});

app.get("/registerDisciplina/:codigoDisciplina", function(req, res) {
    buscaDisciplinaPorCodigo(req.params.codigoDisciplina)
        .then(function (disciplina) {
            if (!disciplina){
                renderizaTelaNotFound(res);
            } else {
                const disciplinaTela = {...disciplina, horarios: criaMatrizHorariosSelecionadosFromBanco(disciplina.horarios)};

                res.render("registerDisciplina", {
                    title: "Alterar disciplina", 
                    disciplina: disciplinaTela
                });
            }
        });
});

function criaMatrizHorariosSelecionadosFromBanco(horarios) {
    let matrizCriada = [];
    
    for (diaSemana = 0; diaSemana < 5; diaSemana++) {
        matrizCriada.push([]);
        for (horarioAula = 0; horarioAula < 4; horarioAula++) {
            let horarioSetado = false;
            horarios.forEach(horario => {
                if (horario.diaSemana == diaSemana && horario.horario == horarioAula) {
                    matrizCriada[diaSemana].push("checked")
                    horarioSetado = true;
                }
            });
            if(!horarioSetado) {
                matrizCriada[diaSemana].push(null);
            }
        }
    }

    return matrizCriada;
}

function criaMatrizHorariosSelecionados(req) {
    const horariosSegunda = [req.body.seg1, req.body.seg2, req.body.seg3, req.body.seg4];
    const horariosTerca = [req.body.ter1, req.body.ter2, req.body.ter3, req.body.ter4];
    const horariosQuarta = [req.body.quat1, req.body.quat2, req.body.quat3, req.body.quat4];
    const horariosQuinta = [req.body.quint1, req.body.quint2, req.body.quint3, req.body.quint4];
    const horariosSexta = [req.body.sex1, req.body.sex2, req.body.sex3, req.body.sex4];

    const horarios = [horariosSegunda, horariosTerca, horariosQuarta, horariosQuinta, horariosSexta];

    return horarios;
}

function cadastraNovaDisciplina(req, res) {
    const codigo = req.body.codigoDisciplina.trim();

    buscaDisciplinaPorCodigo(codigo)
        .then(function(disciplina) {
            if(disciplina) {
                renderizaTelaDadoJaCadastrado(res);
            } else {
                const nome = req.body.nome.trim();
                const horarios = criaMatrizHorariosSelecionados(req);
                let qtdHorariosSelecionados = 0;
                let horariosDiciplinas = [];

                for (diaSemana = 0; diaSemana < horarios.length; diaSemana++) {
                    for (horarioAula = 0; horarioAula < horarios[diaSemana].length; horarioAula++) {
                        if(horarios[diaSemana][horarioAula]){
                            qtdHorariosSelecionados++;
                            horariosDiciplinas.push({diaSemana: diaSemana, horario: horarioAula});
                        }
                    }
                }

                const isDisciplinaValida = validateDisciplina(nome, codigo, qtdHorariosSelecionados, res);
                
                if (isDisciplinaValida) {
                    insereDisciplinaNoBanco(nome, codigo, horariosDiciplinas);
                    res.redirect("/");
                } else {
                    renderizaTelaBadRequest(res);
                }
            }
        }
    );
}

function atualizaDisciplina(req, res) {
    const nome = req.body.nome.trim();
    const codigo = req.params.codigoDisciplina;

    const horarios = criaMatrizHorariosSelecionados(req);
    let qtdHorariosSelecionados = 0;
    let horariosDiciplinas = [];

    for (diaSemana = 0; diaSemana < horarios.length; diaSemana++) {
        for (horarioAula = 0; horarioAula < horarios[diaSemana].length; horarioAula++) {
            if(horarios[diaSemana][horarioAula]){
                qtdHorariosSelecionados++;
                horariosDiciplinas.push({diaSemana: diaSemana, horario: horarioAula});
            }
        }
    }

    const isDisciplinaValida = validateDisciplina(nome, codigo, qtdHorariosSelecionados, res);

    if (!isDisciplinaValida) {
        renderizaTelaBadRequest(res)
    } else {
        atualizaDisciplinaNoBanco(codigo, nome, horariosDiciplinas, res);
    }
}

app.post("/registerDisciplina/:codigoDisciplina?", function(req, res) {
    if (!req.params.codigoDisciplina) {
        cadastraNovaDisciplina(req, res);
    } else {
        atualizaDisciplina(req, res);
    }
});

app.get("/matriculaAluno/:matriculaAluno", function(req, res) {
    buscaAlunoPorMatricula(req.params.matriculaAluno)
        .then(function (aluno) {
            if (!aluno){
                renderizaTelaNotFound(res);
            } else {
                buscaDisciplinas()
                    .toArray(function (err, disciplinas) {
                        res.render("matriculaAluno", {
                            title: "Matricula aluno", 
                            aluno: aluno,
                            listaDisciplinasDisponiveis: disciplinas,//subtrair as selecionadas e negadas
                            listaDisciplinasSelecionadas: disciplinas,//pegar do banco as selecionadas
                            listaDisciplinasNegadas: disciplinas,//pegar do banco as negadas
                            matrizSelecionadas: {},
                            disciplina: {} //tirar
                        });
                    });
            }
        });
});

//serviço para adicionar matéria selecionada (não salva no banco, mas renderiza matricula aluno novamente)
    //Esse serviço deve retirar a matéria selecionada de materias disponíveis
    //Esse serviço pode negar uma matéria e colocar ela em matéria negada
        //Uma matéria pode virar negada se na relação ela tiver a flag matriculaValida false

//serviço para tirar matéria selecionada (não salva no banco, mas renderiza matricula aluno novamente)
    //quando uma eh tirada, verificar se alguma negada pode entrar (cuidado para não entrar com duas kkk)
//Serviço para tirar matéria negada (não salva no banco, mas renderiza matricula aluno novamente)

//Serviço para salvar no banco que salva as matriculas (tanto negadas quando dadas)

//Serviço para consultar as matriculas no banco, baseado em um aluno

///////////Futuramente
//serviço para listar os alunos de uma disciplina

client.connect(function(err, db) {
    app.listen(port, function () {
        console.log("Server running! Press CTRL+C to close");
    });
});