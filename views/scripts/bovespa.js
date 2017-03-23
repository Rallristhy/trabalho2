/*cria um module e direciona para um controlador */
angular.module('bovespaApp', ['angularUtils.directives.dirPagination']).controller('bovespaListController', ['$http', '$scope', function($http, $scope){
  
  /* Declaração do socketio no cliente */
  var socket = io();
  var uploader = new SocketIOFileUpload(socket);

  uploader.listenOnInput(document.getElementById("file_input"));

  uploader.addEventListener("start", function(event){
    $('.progresso').css({"display": "inline"});
    console.log("start");

  });

  uploader.addEventListener("progress", function(event){
    
    var percent = event.bytesLoaded / event.file.size * 100;
    console.log("File is", percent.toFixed(2), "percent loaded");
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
  * Busca Informações da rota /filesCargaInicial no servidor 
  * para dar carga inicial na table
  */
  $http({method: 'GET', url: '/filesCargaInicial'}).then(function successCallback(data) {

      if(data.data.length == 0){
        alert("Nenhum Arquivo no Servidor!");
      }
      /* Recebe o objeto e guarda em arquivos */
      $scope.arquivos = data.data;

  }, function errorCallback(response) {
    console.log(response.data + " Status: " + response.status + " - " + response.statusText);
  });

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


  /* Gráfico */
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
    name:'Petrobras',
    data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4],
    color: '#90ed7d' ,
  }]            
  });

}]);