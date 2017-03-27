/*cria um module e direciona para um controlador */
angular.module('bovespaApp', ['angularUtils.directives.dirPagination']).controller('bovespaListController', ['$http', '$scope', function($http, $scope){
  
  /* Declaração do socketio no cliente */
  var socket = io();
  var uploader = new SocketIOFileUpload(socket);
  var anoSelecionado;
  var mesSelecionado;
  var acaoSelecionado;

  uploader.listenOnInput(document.getElementById("file_input"));

  uploader.addEventListener("start", function(event){
    $('.progresso').css({"display": "inline"});
    console.log(event.file.name);

  });

  uploader.addEventListener("progress", function(event){
    
    var percent = event.bytesLoaded / event.file.size * 100;
    //console.log("File is", percent.toFixed(2), "percent loaded");
    $scope.progresso = percent.toFixed(2);

    $scope.$apply();

  });

  uploader.addEventListener("complete", function(event){
    $scope.progresso = 0;
    $scope.$apply();
    $('.progresso').css({"display": "none"});
    console.log("complete");
  });

  /* Delcaração de variáveis */
  $scope.dataHeader = [];
  $scope.dataCotacao = [];
  $scope.dataTrailer = [];

  $scope.notificacoes = [];

  $scope.contadornotificacao = 0;

  /* 
  * Busca Informações da rota /dataBovespa no servidor 
  * com base no arquivo selecionado na view
  */
    $http({method: 'GET', url: '/dataBovespa'}).then(function successCallback(data) {
       /* Recebe o objeto GET por /data */
      $scope.dataHeader.bovespaHeaderData = data.data[0];
      $scope.dataCotacao.bovespaCotacaoData = data.data[1];
      $scope.dataTrailer.bovespaTrailerData = data.data[2]; 

   }, function errorCallback(response) {
     console.log(response.data + " Status: " + response.status + " - " + response.statusText)
   });

  /* 
  * Capturao o arquivo selecionado na select e envia para o servidor 
  */
  $scope.capturaArquivoSelecionado = function(nome_arquivo){

    socket.emit("arquivoSelecionado", nome_arquivo);
    
  };

  /*
  * Reset no contador de notificação
  */
  $scope.resetnotificacao = function(){
  	
    $('.botaonotificacao:hover').css({"background": "rgba(9, 79, 125, .9)", 
                                "border-color": "rgba(9, 79, 125, .9)"});

    if($scope.contadornotificacao != 0){
      $scope.contadornotificacao = 0;
    }
    
  };

  $scope.capturaAnoAcaoSelecionado = function(anoAcaoSelecionada){

    $('.selecionaMes-label').css({"display": "inline"});

    anoSelecionado = anoAcaoSelecionada;

    socket.emit('buscaMeses', anoAcaoSelecionada);
    
  };

  $scope.capturaMesAcaoSelecionado = function(mesAcaoSelecionada){

    $('.selecionaAcao-label').css({"display": "inline"});

    mesSelecionado = mesAcaoSelecionada;

    socket.emit('buscaAcoes', anoSelecionado, mesAcaoSelecionada);
    
  };

  $scope.capturaAcaoSelecionada = function(acaoSelecionada){

    console.log(acaoSelecionada);

    socket.emit('buscaValores', acaoSelecionada, anoSelecionado, mesSelecionado);
    
  };
  
  
  /* Escutando serviceMonitorArquivos no servidor recebendo a lista de arquivos atualizada */
  socket.on("serviceMonitorArquivos", function(arquivosData){

    /* Atualiza a variável arquivos */
    $scope.arquivos = arquivosData;

    /* Atualiza o scopo */
    $scope.$apply();

  });

  /* Carga na tabela com base no arquivo selecionado */
  socket.on('arquivoSelecionado', function(arquivo) {

    $scope.dataHeader.bovespaHeaderData = arquivo[0];
    $scope.dataCotacao.bovespaCotacaoData = arquivo[1];
    $scope.dataTrailer.bovespaTrailerData = arquivo[3];
    $scope.$apply();
  }); 


  /*
  * Serviço que monitora a adição ou remoção de arquivos no servidor,
  * se ocorrer altera a cor do botão incrementa a notificação e add a
  * notificação
  */
  socket.on('serviceMonitorArquivosAlerta', function(arquivo) {

    $('.botaonotificacao').css({"background": "#c0392b", 
                                "border-color": "#c0392b"
                              });

    $scope.contadornotificacao++;

    $scope.notificacoes.push({status: " Arquivo "+arquivo.nome+" "+arquivo.status,
                              horario: arquivo.horario});

    $scope.$apply();

  });

  socket.on('anoAcao', function(anoAcao){
    $scope.anosAcoes = anoAcao;
    $scope.$apply();
  });

  socket.on('buscaMeses', function(mesesAcao){
    $scope.mesesAcoes = mesesAcao;
    $scope.$apply();
  });

  socket.on('buscaAcoes', function(acao){
    $scope.acoes = acao;
    $scope.$apply();
  });

  socket.on('buscaValores', function(valores, acao){
    $scope.$apply();

    var myChart = Highcharts.chart('container', {

      title: {
        text: 'Cotações Históricas Bovespa'
      },

      subtitle: {
        text: 'Valores de Abertura',                
      },

      xAxis: {
       type: 'linear',
       allowDecimals: false,
     },

     yAxis: {
      title: {
        text: 'Valores em R$',
        type: 'linear',
      }
    },

    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle'
    },

    plotOptions: {
      line: {
        dataLabels: {
          enabled: true,
        },
        enableMouseTracking: false,
      },
    },
    
    //Aqui serao inseridas as informações dos valores de abertura




    series: [{
      name: acao,
      data: valores,
      color: '#90ed7d' ,
    }]            
    });

  });

  // var tst = [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4];
  

  /* Gráfico */
  

}]);