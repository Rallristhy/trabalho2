/*cria um module e direciona para um controlador */
angular.module('bovespaApp', ['angularUtils.directives.dirPagination']).controller('bovespaListController', ['$http', '$scope', function($http, $scope){
  
  /* Declaração do socketio no cliente */
  var socket = io();
  var uploader = new SocketIOFileUpload(socket);
  var anoSelecionado;
  var mesSelecionado;

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

  /* Declaração de variáveis */
  $scope.notificacoes = [];

  $scope.contadornotificacao = 0;

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

    socket.emit('buscaValores', acaoSelecionada, anoSelecionado, mesSelecionado);
    
  };
  
  
  /* Escutando serviceMonitorArquivos no servidor recebendo a lista de arquivos atualizada */
  socket.on("serviceMonitorArquivos", function(arquivosData){

    /* Atualiza a variável arquivos */
    $scope.arquivos = arquivosData;

    /* Atualiza o scopo */
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

  /* 
  * Serviço que recebe do server os anos disponíveis e adiciona na select
  */
  socket.on('anoAcao', function(anoAcao){
    $scope.anosAcoes = anoAcao;
    $scope.$apply();
  });

  /* 
  * Serviço que recebe do server os meses disponíveis e adiciona na select
  */
  socket.on('buscaMeses', function(mesesAcao){
    $scope.mesesAcoes = mesesAcao;
    $scope.$apply();
  });

  /* 
  * Serviço que recebe do server as acoes disponíveis e adiciona na select
  */
  socket.on('buscaAcoes', function(acao){
    $scope.acoes = acao;
    $scope.$apply();
  });

  /* Recebe os valores de acordo com a seleção de ação, ano, mês */
  socket.on('buscaValores', function(valoresAbertura, valoresMaximo, valoresMinimo, valoresMedio, diasLanc, acao){

    /* Criação do Gráfico */
    var myChart = Highcharts.chart('container', {

      title: {
        style: {
          color: 'navy',
          fontWeight: 'bold'
        },
        text: 'Ação - ' + acao,
      },
      subtitle: {
        style: {
          color: 'red',
          fontFamily: 'Courier New',
          fontSize: '2em'
        }                
      },
      xAxis: {
        type: 'linear',
        allowDecimals: false,
        crosshair: true,
        categories: diasLanc,
        title: {
          text: 'Dias'
        }
      },
      plotOptions: {
        series: {
          allowPointSelect: true,
        }
      },
      yAxis: {
        title: {
          text: 'Valores em R$',
          type: 'linear',
        }
      },
      /*Box de legenda com as informações de cada Valor, informando que deve-se clicar para obter o valor detalhado de cada preço*/
      legend: {
        title: {
          text: 'Preços<br/><span style="font-size: 10px; color: red; font-weight: normal">(Clique ao lado para ESCOLHER um preço)</span>',
          style: {
            fontStyle: 'italic',
            fontWeight: 'bold',
          }
        },
        layout: 'vertical',
        align: 'right',
        enabled: true,
        verticalAlign: 'middle'
      },
      plotOptions: {
        line: {
          dataLabels: {
            enabled: true,
          },
          enableMouseTracking: true,
        },
      },
      /* Imprimir e salvar em imagens o gráfico*/
      exporting: {
        buttons: {
          contextButton: {
            text: 'Download',             
          }
        }
      },
      /*Cria o primeiro gráfico com os Valores Ilustrativos, para serem clicados*/
      series: [{
        name: '1 - Preço de Abertura',
        color: 'green',
        data:[{
          name: '1 - Preço Abertura',
          drilldown: 'abertura',
          y:1,
          color: 'green',
        }]
      },
      {
        name: '2 - Preço Maximo',
        color: '#1A5276',
        data:[{
          name: 'Preço Máximo',
          drilldown: 'maximo',
          y : 2,
          color: '#1A5276',
        }]
      },
      {
        name: '3 - Preço Minimo',
        color: '#6C3483',
        data:[{
          name: 'Preço Mínimo',
          drilldown: 'minimo',
          y:3,
          color: '#6C3483',
        }]
      },
      {
        name:'4 - Preço Medio',
        color: '#D35400',
        data:[{
          name: 'Preço Médio',
          drilldown: 'medio',
          y:4,
          color: '#D35400',
        }]
      }],
      
      /*Cria um gráfico para cada Valor, quando é selecionado anteriormente*/
      drilldown: {
        series: [{
          id:'abertura',
          name: 'Preço Abertura',
          data: valoresAbertura,
          color: 'green',
        }, {
          id:'maximo',
          name: 'Preço Máximo',
          data: valoresMaximo,
          color: '#1A5276',
        }, {
          id:'minimo',
          name: 'Preço Mínimo',
          data: valoresMinimo,
          color: '#6C3483',
        },
        {
          id:'maximo',
          name: 'Preço Máximo',
          data: valoresMaximo,
          color: '#1A5276',
        }, {
          id:'medio',
          name: 'Preço Médio',
          data: valoresMedio,
          color: '#D35400',
        }]
      }

    });
  });
}]);


