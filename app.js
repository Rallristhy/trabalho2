/* Importando express */
const express = require('express');
const app = express();

/* Cria um server */
const server = require('http').createServer(app);

/* Importa o socket.io e passa para seu módulo o server criado */
const io = require('socket.io')(server);

/* Importando File System */
const fs = require('fs');

/* Importando Componente responsável pela manipulação e monitoração de pastas e arquivos */
const chokidar = require('chokidar');

/* Importando Componente responsável pelo upload de arquivos */
const SocketIOFileUploadServer = require('socketio-file-upload');

/* Importando sqlite3 DB */
const sqlite3 = require('sqlite3').verbose();

/* Mapeando caminhos para visibilidade nas views */
app.use("/bower_components",  express.static(__dirname + '/bower_components'));
app.use("/node_modules",  express.static(__dirname + '/node_modules'));
app.use("/views",  express.static(__dirname + '/views'));
app.use("/resources",  express.static(__dirname + '/resources'));

/* Vetores para guardar as informações */
var arquivosData = arquivosData || [];

/* Variável que guarda o diretorio dos arquivos */
var dirArquivos = "resources/files/";

/* Declação do monitor de diretório */
var monitor = chokidar.watch(dirArquivos, { ignored: /^\./, persistent: true });

/************************************************ SQLITE DB ************************************************/
function createDb(){
	db = new sqlite3.Database('bovespa.sqlite3', createTable);
	console.log('Banco de Dados Criado');
}

function createTable(){
	db.run('CREATE TABLE IF NOT EXISTS bovespa (acao TEXT, data TEXT, preco_abertura REAL, preco_maximo REAL, preco_minimo REAL, preco_medio REAL)');
	console.log('Tabela bovespa, criada com sucesso!');
}

function closeDB(){
	console.log('closeDB');
	db.close();
}

function insertRows (informacoes_arquivo){

	console.log('Inciciando Inserção!');

	var stmt = db.prepare ('INSERT INTO bovespa VALUES (?, ?, ?, ?, ?, ?)'); 

	informacoes_arquivo.forEach(function ( tupla ) {
		stmt.run (
			tupla.acao,
			tupla.data_lanc,
			tupla.preco_abertura,
			tupla.preco_maximo,
			tupla.preco_minimo,
			tupla.preco_medio);
	});

	stmt.finalize(closeDB);
}

createDb();

/***********************************************************************************************************/

/* Monitora novos arquivos */
monitor.on('add', function(novoArquivo) {

	/* Captura data/hora atual */
	now = new Date;

	/* Armazena no vetor o novo arquivo ignorando o caminho completo */
	arquivosData.push(novoArquivo.substring(dirArquivos.length));

	/* Envia o para o cliente o vetor atualizado*/
	io.emit('serviceMonitorArquivos', arquivosData);
	io.emit('serviceMonitorArquivosAlerta', {
												nome: novoArquivo.substring(dirArquivos.length), 
												status: 'adicionado',
												horario : now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds()});

});

/* Monitora arquivos excluídos */
monitor.on('unlink', function(excluiArquivo) {

	now = new Date;

	/* Procura o arquivo excluído e remove do vetor */
	arquivosData.forEach(function (arquivo, indice) {
		if (arquivo == excluiArquivo.substring(dirArquivos.length)){
			arquivosData.splice(indice, 1);
		}
	});

	/* Envia o para o cliente o vetor atualizado*/
	io.emit('serviceMonitorArquivos', arquivosData);
	io.emit('serviceMonitorArquivosAlerta', {
											 nome: excluiArquivo.substring(dirArquivos.length), 
											 status: 'excluído',
											 horario : now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds()});

});

/************************************************ SOCKETIO *************************************************/
io.on('connection', function(socket){

	var uploader = new SocketIOFileUploadServer();

	uploader.dir = dirArquivos;

	uploader.on("start", function(event){
    	console.log("start: "+event.file.name);

	});

	uploader.on("saved", function(event){
		console.log('Entrou no saved');
    	console.log(event.file.name);

    	var informacoes_arquivo = [];

    	fs.readFile(dirArquivos+event.file.name, function (err, data) {

			/* Tratamento caso dê algum erro ao abrir/ler o arquivo */
			if (err) {
				return console.error(err);
			}

		   	/*Convertendo informação do arquivo em string*/
		   	var text = data.toString();

		   	/*Quebra linha a linha e quarda em um vetor*/
		   	var lines = text.split( '\n' );

		   	/*Percorrendo linha a linha do Arquivo*/
		   	lines.forEach(function ( line ) {

		  		/*Fazendo a leitura do Header*/
				if (line.substring(0, 2) == '00'){
					var h_tipo_registro = line.substring(0, 2);
				 	var h_nome_arquivo = line.substring(2, 15);
				 	var h_codigo_da_origem = line.substring(15, 23);
				 	var h_data_geracao_do_arquivo = line.substring(23, 31);
				 	var h_reserva = line.substring(31, 245);
					
				}

				/*Fazendo a leitura do Cotações*/
				else if (line.substring(0, 2) == '01'){
					var c_tipo_registro = parseInt(line.substring(0, 2));
					var c_data_do_pregao = parseInt(line.substring(2, 10));
					var c_codigo_bdi = line.substring(10, 12);
					var c_codigo_de_negociacao_do_papel = line.substring(12, 24);
					var c_tipo_de_mercado = line.substring(24, 27);
					var c_nomres = line.substring(27, 39);
					var c_especificacao_do_papel = line.substring(39, 49);
					var c_prazot = line.substring(49, 52);
					var c_moeda_de_referencia = line.substring(52, 56);
					var c_preabe = (parseInt((line.substring(56, 69)))/100).toFixed(2);
					var c_premax = (parseInt((line.substring(69, 82)))/100).toFixed(2);
					var c_premin = (parseInt((line.substring(82, 95)))/100).toFixed(2);
					var c_premed = (parseInt((line.substring(95, 108)))/100).toFixed(2);
					var c_preult = (parseInt((line.substring(108, 121)))/100).toFixed(2);
					var c_preofc = (parseInt((line.substring(121, 134)))/100).toFixed(2);
					var c_preofv = (parseInt((line.substring(134, 147)))/100).toFixed(2);
					var c_totneg = line.substring(147, 152);
					var c_quatot = line.substring(152, 170);
					var c_voltot = (parseInt((line.substring(170, 188)))/100).toFixed(2);
					var c_preexe = (parseInt((line.substring(188, 201)))/100).toFixed(2);
					var c_idopc = line.substring(201, 202);
					var c_datven = line.substring(202, 210);
					var c_fatcot = line.substring(210, 217);
					var c_ptoexe = line.substring(217, 230);
					var c_codisi = line.substring(230, 242);
					var c_dismes = line.substring(242, 245);

					// informacoes_arquivo.push({
					// 	acao: c_codigo_de_negociacao_do_papel, 
					// 	data_lanc: c_data_do_pregao,
					// 	preco_abertura: c_preabe,
					// 	preco_maximo: c_premax,
					// 	preco_minimo: c_premin,
					// 	preco_medio: c_premed
					// });
					
				}



				/*Fazendo a leitura do Trailer*/
				else if (line.substring(0, 2) == '99'){
					var t_tipo_registro = line.substring(0, 2);
					var t_nome_arquivo = line.substring(2, 15);
					var t_codigo_da_origem = line.substring(15, 23);
					var t_data_geracao_do_arquivo = line.substring(23, 31);
					var t_total_registros = parseInt(line.substring(31, 42));
					var t_reserva = line.substring(42, 245);

				}

			});

		   	// insertRows(informacoes_arquivo);

		});

	});

	uploader.listen(socket);

	/* Informa ao servidor o IP que conectou na aplicação */
 	console.log(socket.handshake.address.substring(7, 20)+" ID: "+socket.id+" entrou...");

	var acoesAno = [];

	/* Busca Anos Disponíveis e manda para o client */
	db.all('SELECT DISTINCT SUBSTR(data, 1, 4) ano FROM bovespa', function(err, rows){

		rows.forEach(function ( tupla ) {
			acoesAno.push(tupla.ano);
		});


		io.emit('anoAcao', acoesAno);
	});

	/* Busca Meses Disponíveis com base no ano selecionado e manda para o client */
	socket.on('buscaMeses', function(ano) {

		var acoesMes = [];

		db.all('SELECT DISTINCT SUBSTR(data, 5, 2) mes  FROM bovespa WHERE SUBSTR(data, 1, 4) = '+'"'+ano+'"', function(err, rows){
			rows.forEach(function ( tupla ) {
				acoesMes.push(tupla.mes);
			});

			io.emit('buscaMeses', acoesMes);
		});

	});

	/* Busca Ações Disponíveis com base no ano/mes selecionado e manda para o client */
	socket.on('buscaAcoes', function(ano, mes) {

		var acoes = [];

		db.all('SELECT DISTINCT acao FROM bovespa WHERE SUBSTR(data, 1, 4) = '+'"'+ano+'" AND SUBSTR(data, 5, 2) = '+'"'+mes+'"', function(err, rows){
			rows.forEach(function ( tupla ) {
				acoes.push(tupla.acao);
			});

			io.emit('buscaAcoes', acoes);
		});

	});

	/* Busca Valores Disponíveis com base na ação, ano/mes selecionado e manda para o client */
	socket.on('buscaValores', function(acao, ano, mes) {

		var acoesValoresAbertura = [];
		var acoesValoresMaximo = [];
		var acoesValoresMinimo = [];
		var acoesValoresMedio = [];
		var acoesDiasLanc = [];

		db.all('SELECT * FROM bovespa WHERE SUBSTR(data, 1, 4) = '+'"'+ano+'" AND SUBSTR(data, 5, 2) = '+'"'+mes+'"'+' AND acao = '+'"'+acao+'" ORDER BY data', function(err, rows){
		
			rows.forEach(function ( tupla ) {
				acoesValoresAbertura.push(tupla.preco_abertura);
				acoesValoresMaximo.push(tupla.preco_maximo);
				acoesValoresMinimo.push(tupla.preco_minimo);
				acoesValoresMedio.push(tupla.preco_medio);
				acoesDiasLanc.push(tupla.data.substring(6));
			});

			io.emit('buscaValores', acoesValoresAbertura, acoesValoresMaximo, acoesValoresMinimo, acoesValoresMedio, acoesDiasLanc, acao);

		});

	});

	/* Fechando Conexão entre Cliente-Servidor */
   	socket.on('disconnect', function(){

   		/* Informa ao servidor o IP que desconectou na aplicação */
     	console.log(socket.handshake.address.substring(7, 20)+" ID: "+socket.id+' saiu...');
   	});

});

/***********************************************************************************************************/

/* Rota Padrão */
app.get ('/', function (request, response){
	response.sendFile(__dirname + '/views/index.html');
});

/* Listando APP na porta 6060 */
server.listen (6060, function(){
	console.log ('Server running...');
});
