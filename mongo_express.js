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

app.get("/", function(req, res) {
    client
        .db(dbName)
        .collection("aluno")
        .find({})
        .toArray(function (err, alunos) {
            client
            .db(dbName)
            .collection("disciplina")
            .find({})
            .toArray(function (err, disciplinas) {
                res.render("home", {title: "Inicio", listaAlunos: alunos, listaDisciplinas: disciplinas});
            });
        });
});

app.get("/registerAluno", function(req, res) {
    res.render("registerAluno", {
        title: "Novo aluno",
        aluno: {}
    });
});

app.get("/registerAluno/:matriculaAluno", function(req, res) {
    client
        .db(dbName)
        .collection("aluno")
        .findOne({matriculaAluno: req.params.matriculaAluno})
        .then(function (aluno) {
            if (!aluno)
                res.render("naoEncontrado", {title: "Não Encontrado"});
            else
                res.render("registerAluno", {
                    title: "Alterar aluno", 
                    aluno: aluno
                });
        });
});

app.post("/registerAluno/:matricula?", function(req, res) {

    if (!req.params.matricula) {
        var matricula = req.body.matriculaAluno.trim();
        
        client
        .db(dbName)
        .collection("aluno")
        .findOne({matriculaAluno:matricula})
        .then(function(aluno){

            if(aluno) {
                res.render("dadoJaCadastrado", {codigo: matricula, title: "Dado já cadastrado"});
            } else{
                var nome = req.body.nome.trim();

                if (!nome || !matricula) {
                    res.render("badRequest", {title: "Requisição inválida"});
                    return;
                }
        
                client
                    .db(dbName)
                    .collection("aluno")
                    .insertOne({nome: nome, matriculaAluno: matricula});
                res.redirect("/");
            }
        }

    );

       }
    else {
        var nome = req.body.nome.trim();
        var matricula = req.params.matricula;
        if (!nome) {
            res.render("badRequest", {title: "Requisição inválida"});
            console.log("Nome não informado...")
            return;
        }

        //Realiza o UPDATE no banco.
        console.log("update...")
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
                        console.log(err);
                        throw err;
                    }
                    res.redirect("/");
                    return;
                });
    }
}); 


/////////////////////////////////////////////
//DISCIPLINA
//////////////////////////////////////////////

app.get("/registerDisciplina", function(req, res) {
    res.render("registerDisciplina", {
        title: "Nova disciplina",
        disciplina: {}
    });
});

app.get("/registerDisciplina/:codigoDisciplina", function(req, res) {
    client
        .db(dbName)
        .collection("disciplina")
        .findOne({codigoDisciplina: req.params.codigoDisciplina})
        .then(function (disciplina) {
            if (!disciplina)
                res.render("naoEncontrado", {title: "Não Encontrado"});
            else {
                console.table(disciplina.horarios);
                res.render("registerDisciplina", {
                    title: "Alterar disciplina", 
                    disciplina: disciplina
                });
            }
        });
});


app.post("/registerDisciplina/:codigoDisciplina?", function(req, res) {

    if (!req.params.codigoDisciplina) {
        var codigo = req.body.codigoDisciplina.trim();
        
        client
        .db(dbName)
        .collection("disciplina")
        .findOne({codigoDisciplina: codigo})
        .then(function(disciplina){

            if(disciplina) {
                res.render("dadoJaCadastrado", {codigo: codigo, title: "Dado já cadastrado"});
            } else{
                let nome = req.body.nome.trim();

                let horariosSegunda = [req.body.seg1, req.body.seg2, req.body.seg3, req.body.seg4];
                let horariosTerca = [req.body.ter1, req.body.ter2, req.body.ter3, req.body.ter4];
                let horariosQuarta = [req.body.quat1, req.body.quat2, req.body.quat3, req.body.quat4];
                let horariosQuinta = [req.body.quint1, req.body.quint2, req.body.quint3, req.body.quint4];
                let horariosSexta = [req.body.sex1, req.body.sex2, req.body.sex3, req.body.sex4];

                let horarios = [horariosSegunda, horariosTerca, horariosQuarta, horariosQuinta, horariosSexta];

                let diaSemana = 0;
                let horariosPosicao = 0;
                let qtdSelecionados = 0;
                
                let posicoesHorariosDisciplina = [];

                horarios.forEach(function(horariosDias){ 
                    horariosDias.forEach(function(horarioDefinido){
                        if(horarioDefinido){
                            qtdSelecionados++;
                            posicoesHorariosDisciplina.push({diaSemana: diaSemana, horario: horariosPosicao});
                        }              
                        horariosPosicao++;          
                    })
                    diaSemana++; 
                    horariosPosicao = 0;
                }) ;

                if (!nome || !codigo || (qtdSelecionados < 1 || qtdSelecionados > 4)) {
                    res.render("badRequest", {title: "Requisição inválida"});
                    return;
                }

                client
                    .db(dbName)
                    .collection("disciplina")
                    .insertOne({nome: nome, codigoDisciplina: codigo, horarios: posicoesHorariosDisciplina});
                res.redirect("/");
            }
        }

    );

       }
    else {
        var nome = req.body.nome.trim();
        var codigo = req.params.codigoDisciplina;

        if (!nome) {
            res.render("badRequest", {title: "Requisição inválida"});
            console.log("Nome não informado...")
            return;
        }

        //Realiza o UPDATE no banco.
        console.log("update...")
            client
            .db(dbName)
            .collection("disciplina")
            .updateOne(
                {
                    codigoDisciplina: codigo
                },
                {
                    $set: {nome: nome}
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
}); 



client.connect(function(err, db) {
    app.listen(port, function () {
        console.log("Server running! Press CTRL+C to close");
    });
});