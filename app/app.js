/**
 * @fileoverview アプリケーション UI
 * @author       Ryoji Morita
 * @version      0.0.1
*/
const SV_IP   = 'reception.rp.lfx.sony.co.jp';  // node.js server の IP アドレス
//const SV_IP   = '43.2.100.151';                 // node.js server の IP アドレス
//const SV_IP   = '192.168.91.11';                // node.js server の IP アドレス
const SV_PORT = 4000;                           // node.js server の port 番号

let server = io.connect('http://' + SV_IP + ':' + SV_PORT); //ローカル


//-----------------------------------------------------------------------------
// ブラウザオブジェクトから受け取るイベント
window.onload = function() {
  console.log("[app.js] window.onloaded");
};


window.onunload = function() {
  console.log("[app.js] window.onunloaded");
};


//-----------------------------------------------------------------------------
// サーバから受け取るイベント
server.on('connect', function() {               // 接続時
  console.log("[app.js] " + 'connected');
});


server.on('disconnect', function(client) {    // 切断時
  console.log("[app.js] " + 'disconnected');
});


let g_cmnt = "";


server.on('S_to_C_TIME', function(data) {
  console.log("[app.js] " + 'S_to_C_TIME');
  console.log("[app.js] data = " + data.value);
  resetMonitor();
});


server.on('S_to_C_DATA', function(data) {
  console.log("[app.js] " + 'S_to_C_DATA');
  console.log("[app.js] data = " + JSON.stringify(data));
  console.log("[app.js] date = " + data.lastVisitDay.substr(8, 2));
//  let obj = (new Function("return " + data))();

  // モニタに表示する
  displayMonitor(data);

  // data.name を苗字と "さん" の形にする
  let lastname = data.name.split(' ');
  data.name = lastname[0] + postfix;

  // コメントを取得する
  g_cmnt = getCmnt(data);

  // 6sec 後にあいさつをしゃべる
  setTimeout("sendTalkHello()", 6000);

  // 10sec 後にモニタ表示をリセットする
  setTimeout("resetMonitor()", 10000);

});


/**
 * モニタ表示に表示する
 * @param {object} data - 表示する json 形式のデータ
 * @return {void}
 * @example
 * displayMonitor();
*/
function displayMonitor(jsonObj) {
  console.log("[app.js] displayMonitor()");
  console.log("[app.js] jsonObj = " + JSON.stringify(jsonObj));

  // Special Name
  let name = [
              {gid:'0000900576', name:'中田先生',     postfix:'さん'}, // 中田 充
              {gid:'0000920698', name:'本村パパ',     postfix:'さん'}, // 本村 謙介
              {gid:'0000931034', name:'金子店長',     postfix:'さん'}, // 金子 孝幸
              {gid:'0000108215', name:'福馬工房長',   postfix:'さん'}, // 福馬 洋平
              {gid:'0000114347', name:'マイロード',   postfix:''    }, // 森田 良二
              {gid:'0000134706', name:'ぼす',         postfix:'さん'}, // 林 哲也
              {gid:'0000139082', name:'鈴木副工房長', postfix:'さん'}, // 鈴木 龍一
              {gid:'0000139174', name:'のぶし',       postfix:'さん'}  // 山本 崇晴
             ];

  let postfix = 'さん';

  // data.gid が name テーブルにあれば data.name を変える
  for(let value of name) {
    if(value.gid == jsonObj.gid) {
      jsonObj.name = value.name;
      postfix      = value.postfix;
    }
  }

  document.getElementById('val_prefix' ).innerHTML = 'ようこそ';
  document.getElementById('val_name'   ).innerHTML = jsonObj.name;  // 名前を表示
  document.getElementById('val_time'   ).innerHTML = '';            // 時刻表示をクリア
  document.getElementById('val_postfix').innerHTML = postfix;       // postfix を表示
}


/**
 * モニタ表示をデフォルト状態にリセットする
 * @param {void}
 * @return {void}
 * @example
 * resetMonitor();
*/
function resetMonitor() {
  console.log("[app.js] resetMonitor()");

  let date = new Date();
  let yobi = new Array('日', '月', '火', '水', '木', '金', '土');

  let month = ('0' + (date.getMonth() + 1)).slice(-2);
  let day   = ('0' + date.getDate()).slice(-2);
  let week  = date.getDay();

  let hour = ('0' + date.getHours()).slice(-2);   // 現在の時間を 2 桁表記で取得
  let min  = ('0' + date.getMinutes()).slice(-2); // 現在の分  を 2 桁表記で取得
  let time = hour + ':' + min;

  document.getElementById('val_prefix' ).innerHTML = '平成３１年　' + month + '/' + day + '(' + yobi[week] + ')';
  document.getElementById('val_name'   ).innerHTML = '';    // 名前を表示
  document.getElementById('val_time'   ).innerHTML = time;  // 時間を表示
  document.getElementById('val_postfix').innerHTML = '';    // postfix を表示
}


/**
 * コメントを返す
 * @param {object} data - { gid:"", name:"", cnt:1, lastVisitDay:"" } 形式のオブジェクト
 * @return {string} cmnt - コメントの文字列
 * @example
 * getCmnt();
*/
function getCmnt(data) {
  console.log("[app.js] getCmnt()");
  console.log("[app.js] data.name         = " + data.name);
  console.log("[app.js] data.lastVisitDay = " + data.lastVisitDay);

  let prefix = ['ようこそ',
                'こんにちわ',
                'いらっしゃいませ'];
  let postfix = ['',
                 'ご利用ありがとうございます',
                 'ステージ上の畳の上に椅子を置くときは足あとが残らないようにしてください'];
  let no_pre  = Math.floor(Math.random() * prefix.length);
  let no_post = Math.floor(Math.random() * postfix.length);
  let cmnt = '';

  // 日付をチェックしてコメントを cmnt にセット
  let date = new Date();

  let day_flag = parseInt(data.lastVisitDay.substr(8, 2));
  console.log("[app.js] date.getDate() = " + date.getDate());
  console.log("[app.js] day_flag       = " + day_flag);

  let num = date.getDate() - day_flag;
  if(day_flag !== NaN && num > 3) {
    cmnt = prefix[ no_pre ] + data.name + '、' + num + '日ぶりですね。';
  } else {
    cmnt = postfix[ no_post ];
  }
  console.log("[app.js] cmnt = " + cmnt);
  return cmnt;
}


/**
 * しゃべる、あいさつのデータを送る。
 * @param {void}
 * @return {void}
 * @example
 * sendTalkHello();
*/
function sendTalkHello() {
  console.log("[app.js] sendTalkHello()");
  console.log("[app.js] g_cmnt = " + g_cmnt);

  console.log("[app.js] server.emit(" + 'C_to_S_TALK_HELLO' + ")");
  server.emit('C_to_S_TALK_HELLO', g_cmnt);

  // g_cmnt をクリア
  g_cmnt = '';
}


//-----------------------------------------------------------------------------
// ドキュメント・オブジェクトから受け取るイベント


//-----------------------------------------------------------------------------
/**
 * Set コマンドを送る。
 * @param {string} cmd - コマンドの文字列
 * @return {void}
 * @example
 * sendSetCmd('sudo ./board.out usbkey 0x3E');
*/
function sendSetCmd(cmd) {
  console.log("[app.js] sendSetCmd()");
  console.log("[app.js] cmd = " + cmd);

  console.log("[app.js] server.emit(" + 'C_to_S_SET' + ")");
  server.emit('C_to_S_SET', cmd);
}


