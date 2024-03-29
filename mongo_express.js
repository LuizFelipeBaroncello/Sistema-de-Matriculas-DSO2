const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin2:admin2@cluster0.frbiw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const express = require('express');
const expressLayouts = require('express-ejs-layouts');

var _ = require('lodash');

var app = express();
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.urlencoded());

const port = 80;
const dbName = "matriculas";

let listaDisciplinasDisponiveis = [];
let listaDisciplinasSelecionadas = [];
let listaDisciplinasNegadas = [];
let alunoSendoMatriculado;
let matrizSelecionadas;
let textos = {};
let textosPtBr = {
    alunos: 'Alunos',
    disciplinas: 'Disciplinas',
    matriculas: 'Matrículas',
    primeiraHora: new Date(2020, 1, 1, 8, 0, 0, 0).getHours().toLocaleString('pt-BR', {minimumIntegerDigits: 2}),
    segundaHora: new Date(2020, 1, 1, 8, 0, 0, 0).getHours().toLocaleString('pt-BR', {minimumIntegerDigits: 2}),
    terceiraHora: new Date(2020, 1, 1, 8, 0, 0, 0).getHours().toLocaleString('pt-BR', {minimumIntegerDigits: 2}),
    quartaHora: new Date(2020, 1, 1, 8, 0, 0, 0).getHours().toLocaleString('pt-BR', {minimumIntegerDigits: 2}),
    formatNumeros: () => formatNumeros(),
}
let textosEnUs = {
    alunos: 'Students',
    disciplinas: 'Lessons',
    matriculas: 'enrol',
    primeiraHora: new Date(2020, 1, 1, 8, 0, 0, 0).getHours().toLocaleString('en-US', {minimumIntegerDigits: 2}),
    segundaHora: new Date(2020, 1, 1, 8, 0, 0, 0).getHours().toLocaleString('en-US', {minimumIntegerDigits: 2}),
    terceiraHora: new Date(2020, 1, 1, 8, 0, 0, 0).getHours().toLocaleString('en-US', {minimumIntegerDigits: 2}),
    quartaHora: new Date(2020, 1, 1, 8, 0, 0, 0).getHours().toLocaleString('en-US', {minimumIntegerDigits: 2}),
    formatNumeros: () => formatNumeros(),
}


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

function buscaMatriculasPorMatriculaAluno(matriculaAluno){
    return client
            .db(dbName)
            .collection("matricula")
            .find({matriculaAluno: matriculaAluno})   
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

function setDisciplinaNegadaParaMatriculas(codigo) {
    client
        .db(dbName)
        .collection("matricula")
        .updateMany(
            {
                codigoDisciplina: codigo
            },
            {
                $set: {matriculaValida: false}
            },
            function (err, result) {
                if (err) {
                    console.log(err  + "errror banco");
                    throw err;
                }
                return;
            });
}

function insereMatriculasBanco(matriculas) {
    return client
            .db(dbName)
            .collection("matricula")
            .insertMany(matriculas);
}

function removeAllMatriculasAluno(matriculaAluno) {
    return client
            .db(dbName)
            .collection("matricula")
            .deleteMany({matriculaAluno: matriculaAluno});
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
    textos = textosPtBr;
    renderizaPaginaInicial(res);
});

function renderizaPaginaInicial(res) {
    buscaAlunos()
        .toArray(function (err, alunos) {
            buscaDisciplinas()
                .toArray(function (err, disciplinas) {
                    res.render("home", {title: "Início", listaAlunos: alunos, listaDisciplinas: disciplinas, textos: textos});
                });
        });
}

app.get("/managementMatricula", function(req, res){
    buscaAlunos()
        .toArray(function(err, alunos){
            res.render("managementMatricula",{title: "Gerenciamento De Matriculas", listaAlunos: alunos, textos: textos})
        })

});

app.get("/registerAluno", function(req, res) {
    res.render("registerAluno", {
        title: "Novo aluno",
        aluno: {},
        textos: textos
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
                    aluno: aluno,
                    textos: textos
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

function renderizaTelaDadoJaCadastrado(res, codigo) {
    res.render("dadoJaCadastrado", {codigo: codigo, title: "Dado já cadastrado", textos: textos});
}

function renderizaTelaBadRequest(res) {
    res.render("badRequest", {title: "Requisição inválida", textos: textos});
}

function renderizaTelaNotFound(res) {
    res.render("naoEncontrado", {title: "Não Encontrado", textos: textos});
}

function cadastraNovoAluno(req, res) {
    let matricula = req.body.matriculaAluno.trim();
   
    buscaAlunoPorMatricula(matricula)
       .then(function(aluno) {
            if(aluno) {
                renderizaTelaDadoJaCadastrado(res, matricula);
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
        disciplina: {}, textos: textos
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
                    disciplina: disciplinaTela, textos: textos
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
                renderizaTelaDadoJaCadastrado(res, codigo);
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

    setDisciplinaNegadaParaMatriculas(codigo);

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

function filterDisciplinasDisponiveis(disciplinas, matriculas) {
    return _.filter(disciplinas, function (disciplina){
        return -1 == _.findIndex(matriculas, function(matricula) {
                            return matricula.codigoDisciplina == disciplina.codigoDisciplina;
                        })
    });
}

function criaMatrizDisciplinasMatricula(horarios) {
    let matrizCriada = [];
    
    for (diaSemana = 0; diaSemana < 5; diaSemana++) {
        matrizCriada.push([]);
        for (horarioAula = 0; horarioAula < 4; horarioAula++) {
            let horarioSetado = false;
            horarios.forEach(horario => {
                if (horario.diaSemana == diaSemana && horario.horario == horarioAula) {
                    matrizCriada[diaSemana].push(horario.nome);
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

function handleMatrizDisciplinasSelecionadas() {
    let listaHorariosSelecionados = [];

    listaDisciplinasSelecionadas.forEach(function(disciplina) {
        for (i = 0; i < disciplina.horarios.length; i++) {
            disciplina.horarios[i] = {...disciplina.horarios[i], nome: disciplina.nome};
        }

        disciplina.horarios.forEach(function (horario) {
            listaHorariosSelecionados.push(horario);
        })
    });

    matrizSelecionadas =  criaMatrizDisciplinasMatricula(listaHorariosSelecionados);
}

function filterDisciplinasSelecionadas(disciplinas, matriculas) {
    return _.filter(disciplinas, function(disciplina) {
        return _.some(matriculas, function(matricula) {
            return matricula.codigoDisciplina ==  disciplina.codigoDisciplina && matricula.matriculaValida;
        })
    })
}


function filterDisciplinasNegadas(disciplinas, matriculas) {
    return _.filter(disciplinas, function(disciplina) {
        return _.some(matriculas, function(matricula) {
            return matricula.codigoDisciplina ==  disciplina.codigoDisciplina && !matricula.matriculaValida;
        })
    })
}

app.get("/matriculaAluno/:matriculaAluno", function(req, res) {
    
    buscaAlunoPorMatricula(req.params.matriculaAluno)
        .then(function (aluno) {
            if (!aluno){
                renderizaTelaNotFound(res);
            } else {
                buscaDisciplinas()
                    .toArray(function (err, disciplinas) {
                        buscaMatriculasPorMatriculaAluno(req.params.matriculaAluno)
                            .toArray(function (err, matriculas) {
                                alunoSendoMatriculado = aluno;

                                listaDisciplinasSelecionadas = filterDisciplinasSelecionadas(disciplinas, matriculas); 
                                listaDisciplinasNegadas = filterDisciplinasNegadas(disciplinas, matriculas);


                                listaDisciplinasDisponiveis = filterDisciplinasDisponiveis(disciplinas, matriculas);
                                
                                handleMatrizDisciplinasSelecionadas();
    
                                renderizaTelaMatricula(res);
                            })
                    });
            }
        });
});

function renderizaTelaMatricula(res) {
    res.render("matriculaAluno", {
        title: "Matricula aluno", 
        aluno: alunoSendoMatriculado,
        listaDisciplinasDisponiveis: listaDisciplinasDisponiveis,
        listaDisciplinasSelecionadas: listaDisciplinasSelecionadas,
        listaDisciplinasNegadas: listaDisciplinasNegadas,
        matrizSelecionadas: matrizSelecionadas,
        disciplina: {}, textos: textos //tirar
    });
}

function getDisciplinaSelecionadaPeloUsuario(codigoDisciplina, listaParaAchar) {
    const indexDisciplinaSelecionada = _.findIndex(listaParaAchar, function(disciplina){
        return disciplina.codigoDisciplina == codigoDisciplina;
    })
    
    return listaParaAchar[indexDisciplinaSelecionada];
}

function isNovaDisciplinaConflitante(disciplinaSelecionada) {
    let isConflitante = false;

    listaDisciplinasSelecionadas.forEach(function(disciplina) {
        disciplina.horarios.forEach(function(horario) {
            disciplinaSelecionada.horarios.forEach(function(horarioNova) {
                if (horario.diaSemana == horarioNova.diaSemana && horario.horario == horarioNova.horario) {
                    isConflitante = true;
                }
            });
        })
    });

    return isConflitante;
}

app.get("/matriculaAluno/adicionaSelecionada/:codigoDisciplina", function(req, res) {

    let codigoDisciplina = req.params.codigoDisciplina;

    const disciplinaSelecionada = getDisciplinaSelecionadaPeloUsuario(codigoDisciplina, listaDisciplinasDisponiveis);
    
    let isConflitante = isNovaDisciplinaConflitante(disciplinaSelecionada);

    if (!isConflitante) {
        listaDisciplinasSelecionadas.push(disciplinaSelecionada);
        handleMatrizDisciplinasSelecionadas();
    } else {
        listaDisciplinasNegadas.push(disciplinaSelecionada);
    }

    _.remove(listaDisciplinasDisponiveis, function(disciplina) {
        return disciplina.codigoDisciplina == codigoDisciplina; 
    })
 
    renderizaTelaMatricula(res)
});

app.get("/matriculaAluno/removeSelecionada/:codigoDisciplina", function(req, res) {

    let codigoDisciplina = req.params.codigoDisciplina;
    const disciplinaSelecionada = getDisciplinaSelecionadaPeloUsuario(codigoDisciplina, listaDisciplinasSelecionadas);

    if(disciplinaSelecionada) {
         listaDisciplinasDisponiveis.push(disciplinaSelecionada)
        _.remove(listaDisciplinasSelecionadas, function(disciplina) {
            return disciplina.codigoDisciplina == codigoDisciplina; 
         })
         handleMatrizDisciplinasSelecionadas();
    }

    renderizaTelaMatricula(res)
});

app.get("/matriculaAluno/removeNegada/:codigoDisciplina", function(req, res) {

    let codigoDisciplina = req.params.codigoDisciplina;
    const disciplinaNegada = getDisciplinaSelecionadaPeloUsuario(codigoDisciplina, listaDisciplinasNegadas); 
        
    if (disciplinaNegada) {
        listaDisciplinasDisponiveis.push(disciplinaNegada);
        _.remove(listaDisciplinasNegadas, function(disciplina) {
            return disciplina.codigoDisciplina == codigoDisciplina; 
        })
    } 

    renderizaTelaMatricula(res)
});

app.post("/matriculaAluno/salvaMatricula/:matriculaAluno", function(req, res) {
    let matriculaAluno = req.params.matriculaAluno.trim();

    removeAllMatriculasAluno(matriculaAluno).then(function() {

        let matriculas = [];

        listaDisciplinasSelecionadas.forEach(function(disciplina) {
            matriculas.push({codigoDisciplina: disciplina.codigoDisciplina.trim(), matriculaAluno: matriculaAluno, matriculaValida: true});
        })
        listaDisciplinasNegadas.forEach(function(disciplina) {
            matriculas.push({codigoDisciplina: disciplina.codigoDisciplina.trim(), matriculaAluno: matriculaAluno, matriculaValida: false});
        })
    
        insereMatriculasBanco(matriculas)
            .then(function() {
                res.redirect("/managementMatricula");
            }).catch(function (err) {
                console.log(err);
            })
    })

});
     
client.connect(function(err, db) {
    app.listen(port, function () {
        console.log("Server running! Press CTRL+C to close");
    });
});