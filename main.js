/**
 * @fileoverview メイン・システム
 * @author       Ryoji Morita
 * @version      0.0.1
*/

// 必要なライブラリをロード
let http     = require('http');
let socketio = require('socket.io');
let fs       = require('fs');
let colors   = require('colors');
let schedule = require('node-schedule');
require('date-utils');

const ApiCmn        = require('./js/ApiCmn');
const ApiDocomo     = require('./js/ApiDocomo');
const ApiFileSystem = require('./js/ApiFileSystem');
const DataPerson    = require('./js/DataPerson');
const DataRoom      = require('./js/DataRoom');

const OSCAR = require('./js/OSCAR');


// Ver. 表示
let now = new Date();
console.log("[main.js] " + now.toFormat("YYYY年MM月DD日 HH24時MI分SS秒").rainbow);
console.log("[main.js] " + "ver.01 : app.js".rainbow);

// サーバー・オブジェクトを生成
let server = http.createServer();

// request イベント処理関数をセット
server.on('request', doRequest);

// 待ち受けスタート
const PORT = 4000;
server.listen(process.env.VMC_APP_PORT || PORT);
console.log("[main.js] access to http://localhost:" + PORT);
console.log("[main.js] Server running!");

// request イベント処理
function doRequest(
  req,    // http.IncomingMessage オブジェクト : クライアントからのリクエストに関する機能がまとめられている
  res     // http.serverResponse  オブジェクト : サーバーからクライアントへ戻されるレスポンスに関する機能がまとめられている
){
  switch(req.url) {
  case '/':
    fs.readFile('./app/app.html', 'UTF-8', function(err, data) {
      if(err) {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write('File Not Found.');
        res.end();
        return;
      }
      res.writeHead(200, {'Content-Type': 'text/html',
                          'Access-Control-Allow-Origin': '*'
                    });
      res.write(data);
      res.end();
    });
  break;
  case '/app.js':
    fs.readFile('./app/app.js', 'UTF-8', function(err, data) {
      res.writeHead(200, {'Content-Type': 'application/javascript',
                          'Access-Control-Allow-Origin': '*'
                    });
      res.write(data);
      res.end();
    });
  break;
  case '/style.css':
    fs.readFile('./app/style.css', 'UTF-8', function(err, data) {
      res.writeHead(200, {'Content-Type': 'text/css',
                          'Access-Control-Allow-Origin': '*'
                    });
      res.write(data);
      res.end();
    });
  break;
  }
}


let io = socketio.listen(server);


//-----------------------------------------------------------------------------
// 起動の処理関数
//-----------------------------------------------------------------------------
let g_apiCmn        = new ApiCmn();
let g_apiDocomo     = new ApiDocomo();
let g_apiFileSystem = new ApiFileSystem();
let g_arrayObj      = new Array();

const g_oscarReader = new OSCAR('192.168.100.20', 4000);
const g_gidTable = {};


startSystem();


/**
 * システムを開始する
 * @param {void}
 * @return {void}
 * @example
 * startSystem();
*/
function startSystem() {
  console.log("[main.js] startSystem()");

  // メイン処理
  let timerFlg  = setInterval(function() {
                    let hour = g_apiCmn.hhmmss().substr(0,5);      // hh:mm:ss から hh:mm を取り出して hour にセット
                    io.sockets.emit('S_to_C_TIME', {value:hour});
                  }, 30000);

  let job01 = runClearArrayObj(' 5  23     * * *');

  // OSCAR 関連処理
  initOSCAR();
};


/**
 * node-schedule の Job を登録する。
 * @param {string} when - Job を実行する時間
 * @return {object} job - node-schedule に登録した job
 * @example
 * runStoreFeedback(' 0 0-23/1 * * *');
*/
function runClearArrayObj(when) {
  console.log("[main.js] runClearArrayObj()");
  console.log("[main.js] when = " + when);

  let job = schedule.scheduleJob(when, function() {
    console.log("[main.js] node-schedule で g_arrayObj がクリアされました");
    g_arrayObj.splice(0, g_arrayObj.length);
  });

  return job;
};


/**
 * OSCAR リーダー端末関係の初期化処理を行う。
 * @param {void}
 * @return {void}
 * @example
 * initOSCAR();
*/
function initOSCAR() {
  console.log("[main.js] initOSCAR()");
  let lines = fs.readFileSync('./data/gid.csv', 'utf-8').split('\n');

  for(let value of lines) {
    let data = value.split(',');
    g_gidTable[data[0].slice(0,10)] = data[2];
  }
};


/**
 * OSCAR リーダー端末から情報が来たら io へデータを返す
 * @param {string} 'oscarGID'
 * @return {void}
 * @example
 * N/A
*/
g_oscarReader.on('oscarGID', (gid) => {
  const name = g_gidTable[gid] || '[未登録]';
  console.log("[main.js] " + Date());
  console.log("[main.js] (" + gid + ": " + name + ")");

  if(name != '[未登録]') {
    getData(gid);
  }
});


/**
 * DataPerson オブジェクトを生成 or 更新する
 * @param {string} gid - 訪問者の Global ID
 * @return {void}
 * @example
 * getData('0000114347');
*/
function getData(gid) {
  console.log("[main.js] getData()");
  console.log("[main.js] gid = " + gid);

  let name    = g_gidTable[gid] || 'Guest';
  let data    = {gid: gid, name: name, cnt: 1, lastVisitDay: g_apiCmn.yyyymmdd()};
  let lastday = '';
  console.log("[main.js] data = " + JSON.stringify(data));

  let flag = false;
  for(let value of g_arrayObj) {
    let info = value.get();
    if(info.gid == gid) {
      lastday = info.lastVisitDay;
      value.update();
      flag = true;

      data = value.get();
      break;
    }
  }

  // g_arrayObj に gid の情報がない場合
  if(flag == false) {
    let obj = new DataPerson(data);
    let info = obj.get();
    g_arrayObj.push(info);
  }

  let date = g_apiCmn.yyyymmdd();
  let filename = '/media/pi/USBDATA/reception/' + date + '.txt';
  g_apiFileSystem.write(filename, g_arrayObj);

  // 送る data の lastVisitDay を以前に来た日時にする
  data.lastVisitDay = lastday;
  console.log("[main.js] data = " + JSON.stringify(data));
  io.sockets.emit('S_to_C_DATA', data);
}


//-----------------------------------------------------------------------------
// クライアントからコネクションが来た時の処理関数
//-----------------------------------------------------------------------------
io.sockets.on('connection', function(socket) {

  // 切断したときに送信
  socket.on('disconnect', function() {
    console.log("[main.js] " + 'disconnect');
//  io.sockets.emit('S_to_C_DATA', {value:'user disconnected'});
  });


  // Client to Server
  socket.on('C_to_S_NEW', function(data) {
    console.log("[main.js] " + 'C_to_S_NEW');
  });


  socket.on('C_to_S_DELETE', function(data) {
    console.log("[main.js] " + 'C_to_S_DELETE');
  });


  socket.on('C_to_S_SET', function(data) {
    console.log("[main.js] " + 'C_to_S_SET');
    console.log("[main.js] data = " + data);

    let exec = require('child_process').exec;
    let ret  = exec(data, function(err, stdout, stderr) {
      console.log("[main.js] stdout = " + stdout);
      console.log("[main.js] stderr = " + stderr);
      if(err) {
        console.log("[main.js] " + err);
      }
    });
  });


  socket.on('C_to_S_TALK_HELLO', function(cmnt) {
    console.log("[main.js] " + 'C_to_S_TALK_HELLO');
    console.log("[main.js] cmnt = " + cmnt);
    g_apiDocomo.update('nozomi', 'hello');
    g_apiDocomo.talk(cmnt, function() {
    });
  });


});


