/**
 * @fileoverview メイン・システム
 * @author       Ryoji Morita
 * @version      0.0.1
*/

// 必要なライブラリをロード
var http     = require( 'http' );
var socketio = require( 'socket.io' );
var fs       = require( 'fs' );
var colors   = require( 'colors' );
require( 'date-utils' );
var schedule = require( 'node-schedule' );

const DataPersons = require( './js/DataPersons' );
const DataRoom    = require( './js/DataRoom' );
const Docomo      = require( './js/Docomo' );

const OSCAR = require( './js/OSCAR' );


// Ver. 表示
var now = new Date();
console.log( "[main.js] " + now.toFormat("YYYY年MM月DD日 HH24時MI分SS秒").rainbow );
console.log( "[main.js] " + "ver.01 : app.js".rainbow );
console.log( "[main.js] " + "access to http://localhost:4000" );

// サーバー・オブジェクトを生成
var server = http.createServer();

// request イベント処理関数をセット
server.on( 'request', doRequest );

// 待ち受けスタート
server.listen( process.env.VMC_APP_PORT || 4000 );
console.log( "[main.js] Server running!" );

// request イベント処理
function doRequest(
  req,    // http.IncomingMessage オブジェクト : クライアントからのリクエストに関する機能がまとめられている
  res     // http.serverResponse  オブジェクト : サーバーからクライアントへ戻されるレスポンスに関する機能がまとめられている
){
  switch( req.url ){
  case '/':
    fs.readFile( './app/app.html', 'UTF-8',
      function( err, data ){
        if( err ){
          res.writeHead( 404, {'Content-Type': 'text/html'} );
          res.write( 'File Not Found.' );
          res.end();
          return;
        }
        res.writeHead( 200, {'Content-Type': 'text/html',
                             'Access-Control-Allow-Origin': '*'
                      } );
        res.write( data );
        res.end();
      }
    );
  break;
  case '/app.js':
    fs.readFile( './app/app.js', 'UTF-8',
      function( err, data ){
        res.writeHead( 200, {'Content-Type': 'application/javascript',
                             'Access-Control-Allow-Origin': '*'
                      } );
        res.write( data );
        res.end();
      }
    );
  break;
  case '/style.css':
    fs.readFile( './app/style.css', 'UTF-8',
      function( err, data ){
        res.writeHead( 200, {'Content-Type': 'text/css',
                             'Access-Control-Allow-Origin': '*'
                      } );
        res.write( data );
        res.end();
      }
    );
  break;
  }
}


var io = socketio.listen( server );


//-----------------------------------------------------------------------------
// 起動の処理関数
//-----------------------------------------------------------------------------
var timerFlg;

var persons = new DataPersons();
var room    = new DataRoom();
var docomo  = new Docomo();


/**
 * OSCAR リーダー端末から情報が来たら io へデータを返す
*/
const gidTable = {};
const lines = fs.readFileSync( './data/gid.csv', 'utf-8' ).split('\n');
for( let line of lines ){
  const data = line.split( ',' );
  gidTable[data[0].slice(0,10)] = data[2];
}

const oscarReader = new OSCAR( '192.168.100.20', 4000 );

oscarReader.on( 'oscarGID', (gid) => {
  const name = gidTable[gid] || '[未登録]';
  console.log( "[main.js] " + Date() );
  console.log( "[main.js] (" + gid + ": " + name + ")" );

  if( name != '[未登録]' ){
    getData( gid );
  }
});


/**
 * node-schedule の Job を登録する
 *   04:00 ～ 23:00 の間、1時間ごとに room.StoreDataToday() を実行する
 * @param {void}
 * @return {void}
 * @example
 * startSystem();
*/
//var job = schedule.scheduleJob('59 0-23/1 * * *', function(){
//  console.log( "[main.js] node-schedule で Job (= room.AppendFile() ) が実行されました" );
//  room.AppendFile( "/media/pi/USBDATA/" + yyyymmdd() + "_room.txt" );
//});


startSystem();


/**
 * システムを開始する
 * @param {void}
 * @return {void}
 * @example
 * startSystem();
*/
function startSystem() {
  console.log( "[main.js] startSystem()" );

  var job;

  timerFlg  = setInterval( function(){
                var hour = hhmmss().substr(0,5);      // hh:mm:ss から hh:mm を取り出して hour にセット
                io.sockets.emit( 'S_to_C_TIME', {value:hour} );
              }, 30000 );

  job = runRoom( '59 0-23/1 * * *' );
};


/**
 * node-schedule の Job を登録する
 * @param {string} when - Job を実行する時間
 * @return {object} job - node-schedule に登録した job
 * @example
 * runRoom( ' 0 0-23/1 * * *' );
*/
function runRoom( when ) {
  console.log( "[main.js] runRoom()" );
  console.log( "[main.js] when = " + when );

  var job = schedule.scheduleJob(when, function(){
    console.log( "[main.js] node-schedule が実行されました" );

    var hour = hhmmss().substr(0,2) + ':00';  // hh:mm:ss から hh を取り出す

    room.CreateMDDoc( yyyymmdd(), hour );
    room.Clear();
  });

  return job;
};


//-----------------------------------------------------------------------------
// クライアントからコネクションが来た時の処理関数
//-----------------------------------------------------------------------------
io.sockets.on( 'connection', function( socket ){

  // 切断したときに送信
  socket.on( 'disconnect', function(){
    console.log( "[main.js] " + 'disconnect' );
//  io.sockets.emit('S_to_C_DATA', {value:'user disconnected'});
  });


  // Client to Server
  socket.on( 'C_to_S_NEW', function( data ){
    console.log( "[main.js] " + 'C_to_S_NEW' );
  });


  socket.on( 'C_to_S_DELETE', function( data ){
    console.log( "[main.js] " + 'C_to_S_DELETE' );
  });


  socket.on( 'C_to_S_SET', function( data ){
    console.log( "[main.js] " + 'C_to_S_SET' );
    console.log( "[main.js] data = " + data );

    var exec = require( 'child_process' ).exec;
    var ret  = exec( data,
      function( err, stdout, stderr ){
        console.log( "[main.js] stdout = " + stdout );
        console.log( "[main.js] stderr = " + stderr );
        if( err ){
          console.log( "[main.js] " + err );
        }
      });
  });


  socket.on( 'C_to_S_TALK_HELLO', function( cmnt ){
    console.log( "[main.js] " + 'C_to_S_TALK_HELLO' );
    console.log( "[main.js] cmnt = " + cmnt );

    docomo.Update( docomo.GetVoice(), 'hello' );
    docomo.Talk( cmnt );
  });


});


function getData( gid ){
  console.log( "[main.js] getData()" );
  console.log( "[main.js] gid = " + gid );

  const name = gidTable[gid] || 'Guest';
  console.log( "[main.js] name = " + name );

//  var data = "{ gid:\"" + gid + "\", name:\"" + name + "\" }";

  var data = { gid: gid, name: name, cnt: 1, lastVisitDay: yyyymmdd() };
  console.log( "[main.js] data = " + JSON.stringify(data) );

  // lastVisitDay を得るために GetData() で対象 GID のデータを取得する
  persons.GetMDDocData( data, function( err, doc ){
    console.log( "[main.js] err = " + err );

    var lastVisitDay = yyyymmdd();

    console.log( "[main.js] doc = " + JSON.stringify(doc) );

    if( doc.length == 0 ){
      // データがない場合
      console.log( "[main.js] data = " + JSON.stringify(data) );
      persons.CreateMDDoc( data );
    } else {
      // データがある場合
      data.cnt = doc[0].cnt + 1;
      lastVisitDay = doc[0].lastVisitDay;

      console.log( "[main.js] data = " + JSON.stringify(data) );
      persons.UpdateMDDoc( data );
    }

    // 送る data の lastVisitDay を以前に来た日時にする
    data.lastVisitDay = lastVisitDay;
    console.log( "[main.js] data = " + JSON.stringify(data) );
    io.sockets.emit( 'S_to_C_DATA', data );

    // 訪問者数カウントを更新する
    room.Update();
  });

}


/**
 * 数字が 1 桁の場合に 0 埋めで 2 桁にする
 * @param {number} num - 数値
 * @return {number} num - 0 埋めされた 2 桁の数値
 * @example
 * toDoubleDigits( 8 );
*/
var toDoubleDigits = function( num ){
//  console.log( "[main.js] toDoubleDigits()" );
//  console.log( "[main.js] num = " + num );
  num += '';
  if( num.length === 1 ){
    num = '0' + num;
  }
  return num;
};


/**
 * 現在の日付を YYYY-MM-DD 形式で取得する
 * @param {void}
 * @return {string} day - 日付
 * @example
 * yyyymmdd();
*/
var yyyymmdd = function(){
  console.log( "[main.js] yyyymmdd()" );
  var date = new Date();

  var yyyy = date.getFullYear();
  var mm   = toDoubleDigits( date.getMonth() + 1 );
  var dd   = toDoubleDigits( date.getDate() );

  var day = yyyy + '-' + mm + '-' + dd;
  console.log( "[main.js] day = " + day );
  return day;
};


/**
 * 現在の時刻を HH:MM:SS 形式で取得する
 * @param {void}
 * @return {string} time - 時刻
 * @example
 * hhmmss();
*/
var hhmmss = function(){
  console.log( "[main.js] hhmmss()" );
  var date = new Date();

  var hour = toDoubleDigits( date.getHours() );
  var min  = toDoubleDigits( date.getMinutes() );
  var sec  = toDoubleDigits( date.getSeconds() );

  var time = hour + ':' + min + ':' + sec;
  console.log( "[main.js] time = " + time );
  return time;
};


