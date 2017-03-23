 //Importe do sqlite3
var sqlite3 = require('sqlite3').verbose();
var db;

//Criação do Banco de dados e chama a funcao createTable

function createDb(){
	console.log('Criando o DB');
	db = new sqlite3.Database('bovespa.sqlite3',createTable );
}

/*Metodo para poder executar comandos sql; CRIANDO UMA TABELA CHAMADA AULA COM campo info do tipo text
insertRows parametro para inserir apos criar a tabela*/

function createTable(){
	console.log('create Table');
	db.run('CREATE TABLE IF NOT EXISTS acao (info TEXT)', insertRows);
}

/*Prepara uma string sql q espera os paramentros para insert
? bind para nao precisar ficar repetindo as linhas e poder inserir varios valores 
Se tudo der certo faz um commit com o finalize
ReadAllRows funcao para ver se tudo foi inserido certo 
/Stmt vai pegar o valor e inserir no lugar do ? a cada ciclo */

function insertRows (){
	console.log('insert Rows');	
	var stmt = db.prepare ('INSERT INTO acao VALUES (?)'); 
	for(var i = 0; i < 10; i++){	
		stmt.run ('numero: ' + i);

	}

	stmt.finalize(readAllRows);
}

/*Buscar todos oq vc definir na consulta sql
E funcao para erros e buscar a informacao a exibir */

function readAllRows(){
	console.log('read All Rows acao');	
	db.all ('SELECT rowid as id, info FROM acao', function(err, rows){
		rows.forEach(function(row){
			console.log(row.id + ': ' + row.info);
		})
		closeDb();
	});
}

function closeDb(){
	console.log('Close DB');
	db.close();
}

function runChainExample (){
	createDb ();
}

runChainExample ();